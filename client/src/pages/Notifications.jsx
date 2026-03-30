import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { BellIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const resolveComplaintUrl = (notification) => {
    const complaintId =
      notification.complaintId && notification.complaintId._id
        ? notification.complaintId._id
        : notification.complaintId || null;

    if (!complaintId) return '#';

    const rolePrefix = (user?.role || 'resident').toString().toLowerCase();
    const basePath =
      rolePrefix === 'staff'
        ? '/staff/complaints'
        : rolePrefix === 'admin'
          ? '/admin/complaints'
          : '/resident/complaints';

    return basePath + '/' + complaintId;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="mt-2 text-slate-500">Stay updated with your latest alerts and messages.</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="inline-flex items-center px-4 py-2 bg-white text-slate-700 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 hover:text-sky-600 hover:border-sky-200 transition-all shadow-sm"
        >
          <CheckIcon className="h-4 w-4 mr-2" />
          Mark all as read
        </button>
      </div>

      <div className="dashboard-card overflow-hidden bg-white shadow-xl shadow-slate-200/50">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellIcon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No notifications</h3>
            <p className="text-slate-400 mt-1">You're all caught up! Check back later.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`group transition-all hover:bg-slate-50 relative ${!n.isRead ? 'bg-sky-50/40 hover:bg-sky-50/70' : 'bg-white'
                  }`}
              >
                {!n.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-r-lg"></div>
                )}

                <div className="px-6 py-5 flex items-start gap-5">
                  <div className={`flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center ${!n.isRead ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    <BellIcon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <Link
                        to={resolveComplaintUrl(n)}
                        onClick={() => !n.isRead && markAsRead(n._id)}
                        className={`block text-base leading-snug hover:text-sky-600 transition-colors ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                          }`}
                      >
                        {n.title}
                      </Link>
                      <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap ml-4">
                        <ClockIcon className="h-3 w-3" />
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed mb-1 pr-8">
                      {n.message}
                    </p>

                    {n.complaintId && (
                      <Link
                        to={resolveComplaintUrl(n)}
                        onClick={() => !n.isRead && markAsRead(n._id)}
                        className="inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700 mt-2"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
