import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import {
  BellIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
  };

  // Get notification icon color based on type
  const getNotificationColor = (type) => {
    const colors = {
      complaint_raised: 'text-sky-600 bg-sky-50 border-sky-100',
      staff_assigned: 'text-violet-600 bg-violet-50 border-violet-100',
      status_updated: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      deadline_exceeded: 'text-rose-600 bg-rose-50 border-rose-100',
      work_completed: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      complaint_closed: 'text-slate-600 bg-slate-50 border-slate-100',
      rating_received: 'text-amber-600 bg-amber-50 border-amber-100',
    };
    return colors[type] || 'text-slate-600 bg-slate-50 border-slate-100';
  };

  // Get limited notifications (5 if not showing all)
  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  // Resolve complaint URL for a notification (handles populated id or plain id)
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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all ${isOpen
          ? 'bg-sky-50 text-sky-600'
          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-sky-600 animate-pulse" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-rose-500 rounded-full ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl shadow-slate-400/20 ring-1 ring-slate-900/5 z-50 max-h-[32rem] flex flex-col origin-top-right transform transition-all duration-200 ease-out">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm rounded-t-2xl z-10 sticky top-0">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  You have {unreadCount} unread messages
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-100">
                  <BellIcon className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No new notifications for now.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={
                      'group relative transition-all hover:bg-slate-50 ' +
                      (!notification.isRead ? 'bg-sky-50/40 hover:bg-sky-50/60' : 'bg-white')
                    }
                  >
                    {!notification.isRead && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-sky-500 rounded-r-full"></div>
                    )}
                    <div className="px-5 py-4 flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        <BellIcon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <Link
                          to={resolveComplaintUrl(notification)}
                          onClick={() => handleNotificationClick(notification)}
                          className="block focus:outline-none"
                        >
                          <p className={`text-sm leading-snug ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} mb-1 group-hover:text-sky-600 transition-colors`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <ClockIcon className="h-3 w-3 mr-1.5 opacity-70" />
                            <span>
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </Link>
                      </div>

                      {/* Manual Mark as Read (Floating action) */}
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          className="flex-shrink-0 text-slate-300 hover:text-sky-600 p-1.5 rounded-full hover:bg-sky-100 transition-colors opacity-0 group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <div className="w-2 h-2 rounded-full bg-sky-500/50 hover:bg-sky-600"></div>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm rounded-b-2xl sticky bottom-0 z-10">
            {notifications.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-sky-600 mb-2 transition-colors"
              >
                {showAll ? 'Show Less' : `Show ${notifications.length - 5} More`}
              </button>
            )}
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full py-2.5 bg-white border border-slate-200/60 text-sm font-bold text-slate-700 rounded-xl hover:bg-sky-50 hover:text-sky-700 hover:border-sky-100 transition-all shadow-sm"
            >
              View Full History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;