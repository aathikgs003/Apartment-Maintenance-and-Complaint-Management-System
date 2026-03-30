import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { complaintService } from '../../services/complaintService';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const AssignStaffModal = ({ complaint, onClose, onSuccess }) => {
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState(complaint.priority || 'Medium');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAvailableStaff();
    // Set default deadline to 48 hours from now
    const defaultDeadline = new Date();
    defaultDeadline.setHours(defaultDeadline.getHours() + 48);
    setDeadline(defaultDeadline.toISOString().slice(0, 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvailableStaff = async () => {
    try {
      setLoading(true);
      const response = await userService.getAvailableStaff({
        expertise: complaint.category,
      });
      // Server responses use { success, message, data: { staff } }
      setAvailableStaff(response.data?.data?.staff || response.data?.staff || []);
    } catch (error) {
      console.error('Error fetching available staff:', error);
      toast.error('Failed to load available staff');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedStaff) {
      newErrors.staff = 'Please select a staff member';
    }

    if (!deadline) {
      newErrors.deadline = 'Please set a deadline';
    } else {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      await complaintService.assignComplaint(complaint._id, {
        staffId: selectedStaff,
        deadline,
        priority,
      });

      onSuccess();
    } catch (error) {
      console.error('Error assigning complaint:', error);
      toast.error(error.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Assign Staff Member
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              <span className="font-bold text-sky-600 uppercase tracking-wider">{complaint.complaintId}</span> • {complaint.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          {/* Complaint Info */}
          <div className="bg-sky-50 border border-sky-100 p-5 rounded-2xl mb-8">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4">
              Complaint Overview
            </h4>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-slate-500 font-medium mb-1">Category</span>
                <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded border border-sky-100 shadow-sm inline-block">
                  {complaint.category}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium mb-1">Current Priority</span>
                <span className={`font-bold px-2 py-1 rounded inline-block ${complaint.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                    complaint.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                  }`}>
                  {complaint.priority}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500 font-medium mb-1">Description</span>
                <p className="font-medium text-slate-800 bg-white p-3 rounded-xl border border-sky-100 shadow-sm leading-relaxed">
                  {complaint.description}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Select Staff Member <span className="text-rose-500">*</span>
            </label>

            {loading ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="inline-block h-8 w-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-bold text-slate-400">Finding available staff...</p>
              </div>
            ) : availableStaff.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
                <p className="font-bold text-amber-800">
                  No staff available for this category right now.
                </p>
                <p className="text-sm text-amber-600 mt-1">Try changing the search criteria or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                {availableStaff.map((staff) => (
                  <label
                    key={staff._id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${selectedStaff === staff._id
                        ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100 ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-sky-300 hover:bg-white hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center">
                      <div className={`relative flex items-center justify-center h-5 w-5 rounded-full border transition-all ${selectedStaff === staff._id ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'
                        }`}>
                        <input
                          type="radio"
                          name="staff"
                          value={staff._id}
                          checked={selectedStaff === staff._id}
                          onChange={(e) => {
                            setSelectedStaff(e.target.value);
                            if (errors.staff) {
                              setErrors((prev) => ({ ...prev, staff: '' }));
                            }
                          }}
                          className="sr-only"
                        />
                        {selectedStaff === staff._id && <div className="h-2 w-2 bg-white rounded-full" />}
                      </div>

                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="bg-slate-100 p-1.5 rounded-lg mr-3 shadow-sm">
                            <UserIcon className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <span className={`block font-bold text-base transition-colors ${selectedStaff === staff._id ? 'text-sky-900' : 'text-slate-700'
                              }`}>
                              {staff.name}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {staff.expertise?.slice(0, 2).join(', ')}{staff.expertise?.length > 2 && '...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {/* Workload */}
                      <div className={`flex items-center justify-end text-xs font-bold mb-1 ${staff.currentWorkload > 5 ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                        <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                        <span>{staff.currentWorkload || 0} active tasks</span>
                      </div>

                      {/* Rating */}
                      {staff.averageRating > 0 ? (
                        <div className="flex items-center justify-end bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 inline-flex">
                          <StarIconSolid className="h-3 w-3 text-amber-400 mr-1" />
                          <span className="text-xs font-bold text-amber-700">
                            {staff.averageRating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">No ratings</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {errors.staff && (
              <p className="mt-2 text-sm text-rose-600 flex items-center font-bold">
                <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                {errors.staff}
              </p>
            )}
          </div>

          {/* Deadline and Priority */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Deadline */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  if (errors.deadline) {
                    setErrors((prev) => ({ ...prev, deadline: '' }));
                  }
                }}
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-medium transition-all ${errors.deadline ? 'border-rose-300' : 'border-slate-200 focus:border-sky-500'
                  }`}
              />
              {errors.deadline && (
                <p className="mt-2 text-sm text-rose-600 flex items-center font-bold">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                  {errors.deadline}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 font-medium transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-6 py-4 bg-sky-600 text-white rounded-xl hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Assigning...
                </span>
              ) : (
                'Assign Staff'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignStaffModal;