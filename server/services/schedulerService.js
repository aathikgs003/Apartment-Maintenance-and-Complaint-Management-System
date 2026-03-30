import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import {
	notifyDeadlineExceeded,
	cleanOldNotifications,
} from './notificationService.js';
import { CRON_SCHEDULES, DEADLINE } from '../config/constants.js';

let jobs = [];

export const initializeScheduler = (start = true) => {
	if (!start) return;

	try {
		console.log('⏰ Initializing scheduler...');

		// Every hour: mark delayed complaints and notify admins/staff
		const checkDelayedJob = cron.schedule(CRON_SCHEDULES.CHECK_DELAYED, async () => {
			try {
				await Complaint.updateDelayedStatus();

				const delayed = await Complaint.findDelayed();
				if (delayed && delayed.length > 0) {
					for (const complaint of delayed) {
						try {
							await notifyDeadlineExceeded(complaint);
						} catch (err) {
							console.error('Error notifying for delayed complaint:', err.message);
						}
					}
				}
			} catch (err) {
				console.error('Error in delayed check job:', err.message);
			}
		});

		jobs.push(checkDelayedJob);

		// Every 30 minutes: optional deadline warnings (send warnings X hours before)
		const warningJob = cron.schedule(CRON_SCHEDULES.DEADLINE_WARNING, async () => {
			try {
				const now = new Date();
				const warningWindow = new Date(now.getTime() + DEADLINE.WARNING_HOURS_BEFORE * 60 * 60 * 1000);

				const warnings = await Complaint.find({
					deadline: { $gte: now, $lte: warningWindow },
					status: { $nin: ['Completed', 'Closed'] },
				});

				if (warnings && warnings.length > 0) {
					for (const complaint of warnings) {
						// Notify assigned staff and admins about upcoming deadline
						try {
							await notifyDeadlineExceeded(complaint);
						} catch (err) {
							console.error('Error sending deadline warning:', err.message);
						}
					}
				}
			} catch (err) {
				console.error('Error in deadline warning job:', err.message);
			}
		});

		jobs.push(warningJob);

		// Daily: clean old notifications
		const cleanJob = cron.schedule(CRON_SCHEDULES.CLEAN_NOTIFICATIONS, async () => {
			try {
				await cleanOldNotifications(30);
			} catch (err) {
				console.error('Error cleaning old notifications:', err.message);
			}
		});

		jobs.push(cleanJob);

		// Start all jobs
		jobs.forEach((j) => j.start());

		console.log('✅ Scheduler initialized with jobs:', jobs.length);
	} catch (error) {
		console.error('❌ Failed to initialize scheduler:', error.message);
	}
};

export default {
	initializeScheduler,
};

