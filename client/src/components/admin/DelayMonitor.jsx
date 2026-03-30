import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { analyticsService } from '../../services/analyticsService';
import { TableSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EyeIcon,
  UserPlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const DelayMonitor = () => {
  const [delayedComplaints, setDelayedComplaints] = useState([]);
  const [delayStats, setDelayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchDelayedComplaints();
  }, []);

  const fetchDelayedComplaints = async () => {
    try {
      setLoading(true);
      // Fetch delayed complaints and analytics independently so one failure
      // doesn't prevent the other from displaying.
      let complaintsResponse = null;
      let analyticsResponse = null;

      try {
        complaintsResponse = await complaintService.getDelayedComplaints();
        setDelayedComplaints(complaintsResponse.data?.data?.complaints || []);
      } catch (err) {
        console.error('Error fetching delayed complaints:', err);
        toast.error('Failed to load delayed complaints');
        setDelayedComplaints([]);
      }

      try {
        analyticsResponse = await analyticsService.getDelayAnalytics();
        setDelayStats(analyticsResponse.data?.data || {});
      } catch (err) {
        console.error('Error fetching delay analytics:', err);
        toast.error('Failed to load delay analytics');
        setDelayStats({});
      }
    } catch (error) {
      // Fallback generic error logging (shouldn't normally reach here)
      console.error('Unexpected error fetching delay data:', error);
      toast.error('Failed to load delay data');
    } finally {
      setLoading(false);
    }
  };

  // Sort complaints
  const sortedComplaints = [...delayedComplaints].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'deadline':
        aValue = new Date(a.deadline).getTime();
        bValue = new Date(b.deadline).getTime();
        break;
      case 'priority': {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      }
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = new Date(a.deadline).getTime();
        bValue = new Date(b.deadline).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getDelayDuration = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hours = differenceInHours(now, deadlineDate);

    if (hours < 24) {
      return `${hours} hours`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getDelaySeverity = (deadline) => {
    const hours = differenceInHours(new Date(), new Date(deadline));

    if (hours > 72) {
      return { color: 'bg-red-600', text: 'text-red-800', bg: 'bg-red-50', label: 'Critical' };
    } else if (hours > 24) {
      return { color: 'bg-orange-500', text: 'text-orange-800', bg: 'bg-orange-50', label: 'High' };
    } else {
      return { color: 'bg-yellow-500', text: 'text-yellow-800', bg: 'bg-yellow-50', label: 'Medium' };
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Assigned: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || colors.Pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-orange-100 text-orange-800',
      Low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.Medium;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            Delay Monitor
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage overdue complaints
          </p>
        </div>
        <button
          onClick={fetchDelayedComplaints}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && delayStats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg shadow-md p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-900">
              {delayStats.duration?.totalDelayed || 0}
            </p>
            <p className="text-sm text-red-700">Total Delayed</p>
          </div>

          <div className="bg-orange-50 rounded-lg shadow-md p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">
              {Math.round(delayStats.duration?.avgDelayHours || 0)}h
            </p>
            <p className="text-sm text-orange-700">Avg Delay Time</p>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow-md p-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900">
              {Math.round(delayStats.duration?.maxDelayHours || 0)}h
            </p>
            <p className="text-sm text-yellow-700">Max Delay Time</p>
          </div>

          <div className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {delayStats.byStaff?.length || 0}
            </p>
            <p className="text-sm text-blue-700">Staff with Delays</p>
          </div>
        </div>
      )}

      {/* Severity Legend */}
      {!loading && delayedComplaints.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Delay Severity:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm text-gray-600">Medium (&lt; 24h)</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-sm text-gray-600">High (24-72h)</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-red-600 mr-2"></div>
              <span className="text-sm text-gray-600">Critical (&gt; 72h)</span>
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      {!loading && delayedComplaints.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="status">Status</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      )}

      {/* Delayed Complaints List */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : delayedComplaints.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Delayed Complaints
          </h3>
          <p className="text-gray-600">
            All complaints are within their deadlines. Great job! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComplaints.map((complaint) => {
            const severity = getDelaySeverity(complaint.deadline);
            const delayDuration = getDelayDuration(complaint.deadline);

            return (
              <div
                key={complaint._id}
                className={`bg-white rounded-lg shadow-md border-l-4 overflow-hidden ${severity.color === 'bg-red-600'
                    ? 'border-l-red-600'
                    : severity.color === 'bg-orange-500'
                      ? 'border-l-orange-500'
                      : 'border-l-yellow-500'
                  }`}
              >
                {/* Header */}
                <div className={`${severity.bg} px-6 py-4 border-b border-gray-200`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-3 mb-2 md:mb-0">
                      <ExclamationTriangleIcon
                        className={`h-6 w-6 ${severity.color === 'bg-red-600'
                            ? 'text-red-600'
                            : severity.color === 'bg-orange-500'
                              ? 'text-orange-500'
                              : 'text-yellow-500'
                          }`}
                      />
                      <span className="text-lg font-semibold text-gray-900">
                        {complaint.complaintId}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severity.bg} ${severity.text}`}
                      >
                        {severity.label} Delay
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          complaint.status
                        )}`}
                      >
                        {complaint.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Category */}
                      <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                          {complaint.category}
                        </span>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Description:</p>
                        <p className="text-gray-900">{complaint.description}</p>
                      </div>

                      {/* Delay Info */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center text-red-600">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            Overdue by {delayDuration}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          Deadline was:{' '}
                          {format(new Date(complaint.deadline), 'PPp')}
                        </div>
                      </div>

                      {/* Resident Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Resident Information
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center text-sm">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium">
                              Flat {complaint.residentId?.flatNumber}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {complaint.residentId?.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {complaint.residentId?.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Staff & Actions */}
                    <div className="space-y-4">
                      {/* Assigned Staff */}
                      {complaint.assignedTo ? (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 mb-2">
                            Assigned Staff
                          </p>
                          <div className="flex items-center">
                            <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {complaint.assignedTo.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {complaint.assignedTo.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800 font-medium">
                            Not Assigned
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            This complaint needs to be assigned to staff
                          </p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>
                          Created:{' '}
                          {formatDistanceToNow(new Date(complaint.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                        {complaint.assignedAt && (
                          <p>
                            Assigned:{' '}
                            {formatDistanceToNow(new Date(complaint.assignedAt), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Link
                          to={`/admin/complaints/${complaint._id}`}
                          className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <EyeIcon className="h-5 w-5 mr-2" />
                          View Details
                        </Link>
                        {!complaint.assignedTo && (
                          <Link
                            to={`/admin/complaints/${complaint._id}?action=assign`}
                            className="flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <UserPlusIcon className="h-5 w-5 mr-2" />
                            Assign Staff
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delay by Category Summary */}
      {!loading && delayStats?.byCategory && delayStats.byCategory.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Delays by Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {delayStats.byCategory.map((cat, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg text-center"
              >
                <p className="text-2xl font-bold text-red-600">{cat.count}</p>
                <p className="text-sm text-gray-600">{cat._id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff with Most Delays */}
      {!loading && delayStats?.byStaff && delayStats.byStaff.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Staff with Delayed Complaints
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delayed Complaints
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {delayStats.byStaff.slice(0, 10).map((staff, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <span className="font-medium text-gray-900">
                          {staff.staffName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {staff.staffEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        {staff.count} delayed
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/admin/users/${staff._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelayMonitor;