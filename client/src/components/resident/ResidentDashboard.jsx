import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { complaintService } from '../../services/complaintService';
import ComplaintCard from './ComplaintCard';
import { CardSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

import { useTranslation } from 'react-i18next';

const ResidentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats and recent complaints
      const [statsResponse, complaintsResponse] = await Promise.all([
        complaintService.getMyStats(),
        complaintService.getMyComplaints({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);

      // Server responses are shaped as { success, message, data: { ... } }
      setStats(statsResponse.data.data?.stats || {});
      setRecentComplaints(complaintsResponse.data.data?.complaints || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: t('total_complaints'),
      value: stats?.total || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('pending'),
      value: stats?.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: t('in_process'),
      // Consider both 'assigned' and 'inProgress' as in-process
      value: (stats?.assigned || 0) + (stats?.inProgress || 0),
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('completed'),
      // Include closed as part of completed counts
      value: (stats?.completed || 0) + (stats?.closed || 0),
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('welcome_back', { name: user?.name })}
        </h1>
        <p className="mt-2 text-slate-500 text-lg">
          {t('dashboard_overview')}
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="dashboard-card p-6 hover:shadow-md hover:border-sky-200 group transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                  <div className={`h-2 w-2 rounded-full ${card.color} opacity-50`} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  {card.value}
                </h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{card.title}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 to-blue-600 rounded-[2rem] shadow-xl p-8 mb-10 text-white">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">{t('need_maintenance')}</h2>
            <p className="text-sky-100 max-w-xl">
              {t('raise_complaint_desc')}
            </p>
          </div>
          <Link
            to="/resident/complaints/new"
            className="inline-flex items-center px-6 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-bold shadow-lg shadow-black/10 transform hover:scale-105"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            {t('raise_new_complaint')}
          </Link>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {t('recent_complaints')}
          </h2>
          {recentComplaints.length > 0 && (
            <Link
              to="/resident/complaints"
              className="text-sky-600 hover:text-sky-700 font-bold text-sm"
            >
              {t('view_all')}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
              <ClipboardDocumentListIcon className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {t('no_complaints_yet')}
            </h3>
            <p className="text-slate-500 mb-8 font-medium">
              {t('get_started_complaint')}
            </p>
            <Link
              to="/resident/complaints/new"
              className="inline-flex items-center px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-bold shadow-lg shadow-sky-500/30"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              {t('raise_first_complaint')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentComplaints.map((complaint) => (
              <ComplaintCard key={complaint._id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-sky-50/50 border border-sky-100 rounded-[2rem] p-8">
        <h3 className="text-lg font-bold text-sky-900 mb-4 flex items-center">
          {t('quick_tips')}
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-medium">
          <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
            <span className="text-sky-500 mr-2 font-bold">•</span>
            <span>
              {t('tip_detailed_desc')}
            </span>
          </li>
          <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
            <span className="text-sky-500 mr-2 font-bold">•</span>
            <span>
              {t('tip_track_status')}
            </span>
          </li>
          <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
            <span className="text-sky-500 mr-2 font-bold">•</span>
            <span>
              {t('tip_rate_service')}
            </span>
          </li>
          <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
            <span className="text-sky-500 mr-2 font-bold">•</span>
            <span>
              {t('tip_check_notifications')}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ResidentDashboard;