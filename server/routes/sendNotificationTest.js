import express from 'express';
import sendEmail from '../utils/mailer.js';

const router = express.Router();

// GET /api/send-notification-test?to=...&subject=...&body=...
router.get('/send-notification-test', async (req, res, next) => {
  try {
    const toRaw = req.query.to || process.env.EMAIL_TEST_RECIPIENT || process.env.EMAIL_USER;
    const to = typeof toRaw === 'string' ? toRaw.trim() : toRaw;
    if (!to) return res.status(400).json({ success: false, message: 'No recipient configured. Pass ?to=you@example.com or set EMAIL_TEST_RECIPIENT' });

    const subject = req.query.subject || 'Admin → Staff: Test Notification';
    const body = req.query.body || `<p>This is a test notification sent from Admin to <strong>${to}</strong>.</p>`;
    const text = req.query.text || `This is a test notification sent from Admin to ${to}.`;

    const result = await sendEmail(to, subject, body, text);

    if (result && result.success) {
      return res.json({ success: true, message: 'Notification sent (or logged)', result });
    }

    return res.status(500).json({ success: false, message: 'Failed to send notification', result });
  } catch (err) {
    next(err);
  }
});

export default router;
