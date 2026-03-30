import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { complaintService } from '../../services/complaintService';
import { CardSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import UpdateStatusModal from './UpdateStatusModal';
import { useNotifications } from '../../hooks/useNotifications';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh dashboard when notifications change (e.g., work completed or status updates)
  useEffect(() => {
    // only fetch if notifications have changed (new length or unread count)
    fetchDashboardData();
  }, [notifications.length, unreadCount]);

  // Polling: refresh dashboard every 30 seconds to keep stats up-to-date
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all assigned complaints
      const response = await complaintService.getMyAssignedComplaints();
      const allComplaints = response.data.data.complaints || [];

      // Separate active and completed complaints
      const active = allComplaints.filter(
        (c) => !['Closed', 'Payment Completed'].includes(c.status)
      );
      const completed = allComplaints.filter(
        (c) => ['Closed', 'Payment Completed'].includes(c.status)
      );

      setAssignedComplaints(active.slice(0, 6)); // Show 6 latest active
      setRecentlyCompleted(completed.slice(0, 3)); // Show 3 recently completed

      // Calculate stats
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const completedToday = allComplaints.filter(
        (c) => c.completedAt && new Date(c.completedAt) >= todayStart
      );

      const ratingsReceived = completed.filter((c) => c.rating);
      const avgRating =
        ratingsReceived.length > 0
          ? (
            ratingsReceived.reduce((sum, c) => sum + c.rating.rating, 0) /
            ratingsReceived.length
          ).toFixed(1)
          : 0;

      setStats({
        total: active.length,
        assigned: active.filter((c) => c.status === 'Assigned').length,
        inProgress: active.filter((c) => c.status === 'In Progress').length,
        completedToday: completedToday.length,
        avgRating: parseFloat(avgRating),
        totalRatings: ratingsReceived.length,
        delayed: active.filter((c) => c.isDelayed).length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowUpdateModal(true);
  };

  const handleStatusUpdated = () => {
    setShowUpdateModal(false);
    setSelectedComplaint(null);
    fetchDashboardData();
    toast.success('Status updated successfully!');
  };

  const getStatusColor = (status) => {
    const colors = {
      Assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Payment Pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'Payment Received': 'bg-teal-100 text-teal-800 border-teal-200',
      'Payment Completed': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status] || colors.Assigned;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-500',
      Medium: 'bg-orange-500',
      Low: 'bg-green-500',
    };
    return colors[priority] || colors.Medium;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-slate-500 text-lg">
            Here's an overview of your assigned maintenance tasks
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {user?.expertise && user.expertise.length > 0 && user.expertise.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200"
                >
                  {skill}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                toast('Refreshing dashboard...');
                fetchDashboardData();
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Assigned */}
              <div className="dashboard-card p-6 group hover:border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 group-hover:scale-110 transition-transform duration-300">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  {stats.delayed > 0 ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">
                      {stats.delayed} delayed
                    </span>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-blue-500 opacity-50" />
                  )}
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  {stats.total}
                </h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Active Assignments</p>
              </div>

              {/* Assigned (Not Started) */}
              <div className="dashboard-card p-6 group hover:border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-50 group-hover:scale-110 transition-transform duration-300">
                    <ClockIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-amber-500 opacity-50" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  {stats.assigned}
                </h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Pending Start</p>
              </div>

              {/* In Progress */}
              <div className="dashboard-card p-6 group hover:border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-purple-50 group-hover:scale-110 transition-transform duration-300">
                    <ArrowPathIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-purple-500 opacity-50" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  {stats.inProgress}
                </h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">In Progress</p>
              </div>

              {/* Completed Today */}
              <div className="dashboard-card p-6 group hover:border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-50 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 opacity-50" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  {stats.completedToday}
                </h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Completed Today</p>
              </div>
            </div>

            {/* Performance Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-500 rounded-[2rem] shadow-xl p-8 mb-10 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center">
                    <StarIcon className="h-6 w-6 mr-2" />
                    Your Performance
                  </h2>
                  <div className="flex items-center space-x-8 mt-4">
                    <div>
                      <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Average Rating</p>
                      <div className="flex items-center mt-2">
                        <div className="flex mr-3 bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <StarIconSolid
                              key={index}
                              className={`h-5 w-5 ${index < Math.round(stats.avgRating)
                                ? 'text-white'
                                : 'text-amber-200/50'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-3xl font-black">
                          {stats.avgRating}
                        </span>
                      </div>
                    </div>
                    <div className="w-px h-12 bg-white/20"></div>
                    <div>
                      <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">Total Ratings</p>
                      <p className="text-3xl font-black mt-1">{stats.totalRatings}</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/staff/history"
                  className="mt-6 md:mt-0 inline-flex items-center px-6 py-3 bg-white text-orange-600 rounded-xl hover:bg-orange-50 transition-colors font-bold shadow-lg shadow-orange-900/20"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Work History
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Active Assignments */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Active Assignments
            </h2>
            {assignedComplaints.length > 0 && (
              <Link
                to="/staff/complaints"
                className="text-sky-600 hover:text-sky-700 font-bold text-sm"
              >
                View All →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : assignedComplaints.length === 0 ? (
            <div className="dashboard-card p-12 text-center">
              <div className="bg-slate-50 p-4 rounded-full inline-block mb-4">
                <ClipboardDocumentListIcon className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                No active assignments
              </h3>
              <p className="text-slate-500 font-medium">
                You have no complaints assigned at the moment. Great job!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="dashboard-card overflow-hidden hover:border-sky-200 group relative"
                >
                  {/* Priority Strip */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${getPriorityColor(complaint.priority)}`}></div>

                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">
                        {complaint.complaintId}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm">
                        {complaint.category}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(
                          complaint.status
                        )}`}
                      >
                        {complaint.status}
                      </span>
                      {complaint.isDelayed && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          Delayed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3 min-h-[3rem]">
                      {complaint.description}
                    </p>

                    {/* Resident Info */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                      <div className="flex items-center text-sm font-bold text-slate-900 mb-1">
                        <MapPinIcon className="h-4 w-4 mr-2 text-slate-400" />
                        Flat {complaint.residentId?.flatNumber}
                      </div>
                      <div className="text-xs text-slate-500 pl-6">
                        {complaint.residentId?.name}
                      </div>
                    </div>

                    {/* Deadline */}
                    {complaint.deadline && (
                      <div
                        className={`flex items-center text-xs font-medium mb-4 ${complaint.isDelayed ? 'text-rose-600' : 'text-amber-600'
                          }`}
                      >
                        <ClockIcon className="h-4 w-4 mr-1.5" />
                        <span>
                          Due:{' '}
                          {formatDistanceToNow(new Date(complaint.deadline), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      {['Assigned', 'In Progress', 'Completed', 'Payment Pending'].includes(complaint.status) ? (
                        <button
                          onClick={() => handleUpdateClick(complaint)}
                          className="col-span-1 px-4 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-bold text-xs shadow-md shadow-sky-200"
                        >
                          Update
                        </button>
                      ) : (
                        <div className="col-span-1"></div>
                      )}

                      <Link
                        to={`/staff/complaints/${complaint._id}`}
                        className="col-span-1 flex items-center justify-center px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-bold text-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        {!loading && recentlyCompleted.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Recently Completed
              </h2>
              <Link
                to="/staff/history"
                className="text-sky-600 hover:text-sky-700 font-bold text-sm"
              >
                View All →
              </Link>
            </div>

            <div className="dashboard-card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {recentlyCompleted.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-xs font-bold text-slate-400">
                            {complaint.complaintId}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                            {complaint.category}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mb-1">
                          Flat {complaint.residentId?.flatNumber} -{' '}
                          {complaint.residentId?.name}
                        </p>
                        {complaint.resolutionTime && (
                          <p className="text-xs text-slate-500">
                            Resolution time: <span className="font-medium text-slate-700">{complaint.resolutionTime} hours</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Rating */}
                        {complaint.rating ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Rating</span>
                            <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                              <div className="flex mr-2">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <StarIconSolid
                                    key={index}
                                    className={`h-3 w-3 ${index < complaint.rating.rating
                                      ? 'text-amber-400'
                                      : 'text-gray-200'
                                      }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-amber-700">
                                {complaint.rating.rating}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No rating</span>
                        )}

                        <Link
                          to={`/staff/complaints/${complaint._id}`}
                          className="text-sm text-sky-600 hover:text-sky-700 font-bold hover:underline"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-sky-50/50 border border-sky-100 rounded-[2rem] p-8">
          <h3 className="text-lg font-bold text-sky-900 mb-4 flex items-center">
            💡 Work Tips
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-medium">
            <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
              <span className="text-sky-500 mr-2 font-bold">•</span>
              <span>
                Update status regularly to keep residents informed
              </span>
            </li>
            <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
              <span className="text-sky-500 mr-2 font-bold">•</span>
              <span>
                Upload proof images when marking work as completed
              </span>
            </li>
            <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
              <span className="text-sky-500 mr-2 font-bold">•</span>
              <span>
                Add detailed remarks about work done and parts used
              </span>
            </li>
            <li className="flex items-start bg-white p-3 rounded-xl border border-sky-100">
              <span className="text-sky-500 mr-2 font-bold">•</span>
              <span>
                Check deadline information and prioritize delayed tasks
              </span>
            </li>
          </ul>
        </div>
      </div>
      {/* Update Status Modal */}
      {showUpdateModal && selectedComplaint && (
        <UpdateStatusModal
          complaint={selectedComplaint}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedComplaint(null);
          }}
          onSuccess={handleStatusUpdated}
        />
      )}
    </>
  );
};

export default StaffDashboard;