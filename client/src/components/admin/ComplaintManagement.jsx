import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import AssignStaffModal from './AssignStaffModal';
import { TableSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';

const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    isDelayed: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeRemarks, setCloseRemarks] = useState('');

  const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Payment Pending', 'Payment Received', 'Payment Completed', 'Closed'];
  const CATEGORIES = COMPLAINT_CATEGORIES;
  const PRIORITIES = ['Low', 'Medium', 'High'];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getAllComplaints();
      // API returns { success, message, data: { complaints, pagination } }
      setComplaints(response.data.data?.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (complaint) => {
    setSelectedComplaint(complaint);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = () => {
    setShowAssignModal(false);
    setSelectedComplaint(null);
    fetchComplaints();
    toast.success('Complaint assigned successfully!');
  };

  const handleCloseComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      await complaintService.closeComplaint(selectedComplaint._id, {
        remarks: closeRemarks,
      });
      toast.success('Complaint closed successfully');
      setShowCloseModal(false);
      setSelectedComplaint(null);
      setCloseRemarks('');
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close complaint');
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;

    try {
      await complaintService.deleteComplaint(complaintId);
      toast.success('Complaint deleted successfully');
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to delete complaint');
    }
  };

  const handleAutoAssign = async (complaintId) => {
    try {
      // Optimistic or waiting? Let's wait.
      // Show loading toast? Or just rely on global loader if we use it.
      // But fetchComplaints sets loading=true which clears the table.
      // So maybe just await and then fetch.
      const toastId = toast.loading('Auto-assigning staff...');
      await complaintService.autoAssignComplaint(complaintId);
      toast.success('Staff auto-assigned successfully!', { id: toastId });
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Auto-assignment failed');
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      searchTerm === '' ||
      complaint.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.residentId?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filters.status === '' || complaint.status === filters.status;

    const matchesCategory =
      filters.category === '' || complaint.category === filters.category;

    const matchesPriority =
      filters.priority === '' || complaint.priority === filters.priority;

    const matchesDelayed =
      !filters.isDelayed || complaint.isDelayed === filters.isDelayed;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesPriority &&
      matchesDelayed
    );
  });

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      Assigned: 'bg-sky-100 text-sky-800 border-sky-200',
      'In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Payment Pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'Payment Received': 'bg-teal-100 text-teal-800 border-teal-200',
      'Payment Completed': 'bg-green-100 text-green-800 border-green-200',
      Closed: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[status] || colors.Pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-rose-100 text-rose-800',
      Medium: 'bg-orange-100 text-orange-800',
      Low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.Medium;
  };

  // Stats
  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter((c) => c.status === 'Pending').length,
    assigned: filteredComplaints.filter((c) => c.status === 'Assigned').length,
    inProgress: filteredComplaints.filter((c) => c.status === 'In Progress').length,
    completed: filteredComplaints.filter((c) => ['Completed', 'Payment Pending', 'Payment Received', 'Payment Completed'].includes(c.status)).length,
    closed: filteredComplaints.filter((c) => c.status === 'Closed').length,
    delayed: filteredComplaints.filter((c) => c.isDelayed).length,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Complaint Management
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            Manage all complaints, assignments, and resolutions
          </p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
              <p className="text-2xl font-black text-slate-900">{stats.total}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total</p>
            </div>
            <div className="bg-amber-50 rounded-2xl shadow-sm p-4 border border-amber-100">
              <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-sky-50 rounded-2xl shadow-sm p-4 border border-sky-100">
              <p className="text-2xl font-black text-sky-600">{stats.assigned}</p>
              <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">Assigned</p>
            </div>
            <div className="bg-indigo-50 rounded-2xl shadow-sm p-4 border border-indigo-100">
              <p className="text-2xl font-black text-indigo-600">{stats.inProgress}</p>
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">In Progress</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl shadow-sm p-4 border border-emerald-100">
              <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Completed</p>
            </div>
            <div className="bg-slate-50 rounded-2xl shadow-sm p-4 border border-slate-200">
              <p className="text-2xl font-black text-slate-600">{stats.closed}</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Closed</p>
            </div>
            <div className="bg-rose-50 rounded-2xl shadow-sm p-4 border border-rose-100">
              <p className="text-2xl font-black text-rose-600">{stats.delayed}</p>
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Delayed</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 mb-8 border border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, category, description, or resident..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 font-medium transition-all"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-6 py-3 rounded-xl transition-all font-bold ${showFilters
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-200'
                : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-medium text-slate-700"
                  >
                    <option value="">All Status</option>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-medium text-slate-700"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      setFilters({ ...filters, priority: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-medium text-slate-700"
                  >
                    <option value="">All Priorities</option>
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delayed Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Delayed
                  </label>
                  <select
                    value={filters.isDelayed ? 'true' : 'false'}
                    onChange={(e) =>
                      setFilters({ ...filters, isDelayed: e.target.value === 'true' })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-medium text-slate-700"
                  >
                    <option value="false">All</option>
                    <option value="true">Delayed Only</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({
                        status: '',
                        category: '',
                        priority: '',
                        isDelayed: false,
                      });
                      setSearchTerm('');
                    }}
                    className="w-full px-4 py-2.5 text-sky-600 border border-sky-600 rounded-lg hover:bg-sky-50 font-bold transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Complaints Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-slate-200">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No complaints found
            </h3>
            <p className="text-slate-500 font-medium">
              {searchTerm || Object.values(filters).some((f) => f)
                ? 'Try adjusting your filters to see more results.'
                : 'No complaints have been raised yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Complaint ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Resident
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {complaint.complaintId}
                        </div>
                        {complaint.isDelayed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 mt-1">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Delayed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {complaint.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {complaint.residentId?.name}
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          Flat {complaint.residentId?.flatNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(
                            complaint.priority
                          )}`}
                        >
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {complaint.assignedTo ? (
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-700 mr-2">
                              {complaint.assignedTo.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{complaint.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {complaint.deadline ? (
                          <div
                            className={`text-sm font-medium ${complaint.isDelayed ? 'text-rose-600 font-bold' : 'text-slate-600'
                              }`}
                          >
                            {format(new Date(complaint.deadline), 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No deadline</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/admin/complaints/${complaint._id}`}
                            className="text-sky-600 hover:text-sky-900 p-1 hover:bg-sky-50 rounded transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          {complaint.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleAutoAssign(complaint._id)}
                                className="text-amber-600 hover:text-amber-900 p-1 hover:bg-amber-50 rounded transition-colors"
                                title="Auto Assign (AI)"
                              >
                                <SparklesIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleAssignClick(complaint)}
                                className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors"
                                title="Assign Staff"
                              >
                                <UserPlusIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {/* Close button — visible for any non-closed complaint, enabled only after payment */}
                          {!['Pending', 'Assigned', 'In Progress', 'Closed'].includes(complaint.status) && (() => {
                            // Determine if closing is allowed:
                            // - "Completed" with no payment mode or free service
                            // - "Payment Received"  (offline payment done)
                            // - "Payment Completed" (online payment done)
                            const canClose = ['Payment Received', 'Payment Completed'].includes(complaint.status) ||
                              (complaint.status === 'Completed' && !['Payment Pending'].includes(complaint.status));

                            return canClose ? (
                              <button
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowCloseModal(true);
                                }}
                                className="text-emerald-600 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded transition-colors"
                                title="Close Complaint"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="Cannot close — payment not yet received"
                                className="text-slate-300 p-1 rounded cursor-not-allowed"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => handleDeleteComplaint(complaint._id)}
                            className="text-rose-600 hover:text-rose-900 p-1 hover:bg-rose-50 rounded transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div >
        )}
      </div >

      {/* Assign Staff Modal */}
      {
        showAssignModal && selectedComplaint && (
          <AssignStaffModal
            complaint={selectedComplaint}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedComplaint(null);
            }}
            onSuccess={handleAssignSuccess}
          />
        )
      }

      {/* Close Complaint Modal */}
      {
        showCloseModal && selectedComplaint && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100">
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Close Complaint
              </h3>
              <p className="text-slate-500 font-medium mb-6">
                Finalize complaint <span className="text-slate-900 font-bold">{selectedComplaint.complaintId}</span>
              </p>

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Closing Remarks <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={closeRemarks}
                onChange={(e) => setCloseRemarks(e.target.value)}
                placeholder="Add final notes about the resolution..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none mb-6 font-medium transition-all"
                rows={4}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setSelectedComplaint(null);
                    setCloseRemarks('');
                  }}
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseComplaint}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 font-bold transition-all"
                >
                  Close Complaint
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default ComplaintManagement;