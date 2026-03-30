import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import UpdateStatusModal from './UpdateStatusModal';
import Loader, { CardSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const AssignedComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const STATUSES = ['Assigned', 'In Progress', 'Completed'];

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const fetchAssignedComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getMyAssignedComplaints();
      setComplaints(response.data.data.complaints || []);
    } catch (error) {
      console.error('Error fetching assigned complaints:', error);
      toast.error('Failed to load complaints');
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
    fetchAssignedComplaints();
    toast.success('Status updated successfully!');
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
      selectedStatus === '' || complaint.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status) => {
    const configs = {
      Assigned: {
        color: 'bg-sky-100 text-sky-800 border-sky-200',
        icon: ClockIcon,
      },
      'In Progress': {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: ArrowPathIcon,
      },
      Completed: {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircleIcon,
      },
    };
    return configs[status] || configs.Assigned;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'bg-rose-100 text-rose-800 border-rose-200',
      Medium: 'bg-amber-100 text-amber-800 border-amber-200',
      Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[priority] || colors.Medium;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Assigned Tasks</h1>
          <p className="mt-2 text-lg text-slate-500">
            Manage your daily maintenance assignments
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by ID, category, resident name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-100 focus:border-sky-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-6 py-3 rounded-xl transition-all font-bold shadow-sm ${showFilters
                  ? 'bg-sky-600 text-white shadow-sky-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedStatus('')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedStatus === ''
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  All Tasks
                </button>
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedStatus === status
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {(searchTerm || selectedStatus) && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedStatus('');
                    }}
                    className="inline-flex items-center text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1.5" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Showing {filteredComplaints.length} of {complaints.length} tasks
            </div>
          </div>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">
              {searchTerm || selectedStatus
                ? 'No matching tasks found'
                : 'All caught up!'}
            </h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
              {searchTerm || selectedStatus
                ? 'Try adjusting your search terms or filters to find what you are looking for.'
                : 'You have no assigned complaints at the moment. Enjoy your break!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredComplaints.map((complaint) => {
              const statusConfig = getStatusConfig(complaint.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={complaint._id}
                  className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-sky-100/50 hover:border-sky-200 transition-all duration-300"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-4 border-b border-slate-100 group-hover:from-sky-50/50 group-hover:to-blue-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 text-slate-400 font-mono font-bold text-sm">
                          {complaint.complaintId}
                        </div>
                        {complaint.isDelayed && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                            Delayed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                          {complaint.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getPriorityColor(
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Column - Details */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* Category & Description */}
                        <div>
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                              {complaint.category}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {complaint.description}
                          </p>
                        </div>

                        {/* Images Preview */}
                        {complaint.images && complaint.images.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                              Attached Images
                            </h4>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {complaint.images.slice(0, 4).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Complaint ${index + 1}`}
                                  className="h-20 w-20 rounded-xl object-cover flex-shrink-0 border border-slate-200 shadow-sm"
                                />
                              ))}
                              {complaint.images.length > 4 && (
                                <div className="h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs text-slate-500 font-bold">
                                    +{complaint.images.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Deadline */}
                        {complaint.deadline && (
                          <div className={`flex items-start gap-2 text-sm p-3 rounded-lg border ${complaint.isDelayed ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                            <ClockIcon className={`h-5 w-5 flex-shrink-0 ${complaint.isDelayed ? 'text-rose-500' : 'text-slate-400'}`} />
                            <div>
                              <p className={`font-bold text-xs uppercase tracking-wide ${complaint.isDelayed ? 'text-rose-600' : 'text-slate-500'}`}>Deadline</p>
                              <p className={`font-bold ${complaint.isDelayed ? 'text-rose-700' : 'text-slate-700'}`}>
                                {formatDistanceToNow(new Date(complaint.deadline), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Resident Info & Actions */}
                      <div className="space-y-6">
                        {/* Resident Info */}
                        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                          <div className="relative z-10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                              <UserIcon className="h-4 w-4 mr-1.5" />
                              Resident Details
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black mr-3 shadow-sm">
                                  {complaint.residentId?.name?.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900">
                                    {complaint.residentId?.name}
                                  </div>
                                  <div className="text-xs font-medium text-slate-500">
                                    Resident
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                  <MapPinIcon className="h-4 w-4" /> Flat
                                </span>
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {complaint.residentId?.flatNumber}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium flex items-center gap-2">
                                  <PhoneIcon className="h-4 w-4" /> Phone
                                </span>
                                <span className="font-bold text-slate-800">
                                  {complaint.residentId?.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                          {['Assigned', 'In Progress'].includes(complaint.status) && (
                            <button
                              onClick={() => handleUpdateClick(complaint)}
                              className="w-full px-4 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-bold shadow-lg shadow-sky-200 flex items-center justify-center"
                            >
                              <ArrowPathIcon className="h-5 w-5 mr-2" />
                              Update Status
                            </button>
                          )}
                          <Link
                            to={`/staff/complaints/${complaint._id}`}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold flex items-center justify-center"
                          >
                            View Full Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default AssignedComplaintsList;