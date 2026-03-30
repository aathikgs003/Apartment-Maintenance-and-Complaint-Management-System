import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import ComplaintCard from './ComplaintCard';
import Loader, { CardSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
  NewspaperIcon,
} from '@heroicons/react/24/outline';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const CATEGORIES = COMPLAINT_CATEGORIES;

  const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Closed'];
  const PRIORITIES = ['Low', 'Medium', 'High'];

  // Fetch complaints
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getMyComplaints();
      setComplaints(response.data.data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((complaint) => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      complaint.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      filters.status === '' || complaint.status === filters.status;

    // Category filter
    const matchesCategory =
      filters.category === '' || complaint.category === filters.category;

    // Priority filter
    const matchesPriority =
      filters.priority === '' || complaint.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
    });
    setSearchTerm('');
  };

  const hasActiveFilters =
    filters.status !== '' ||
    filters.category !== '' ||
    filters.priority !== '' ||
    searchTerm !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Complaints</h1>
          <p className="mt-2 text-lg text-slate-500">
            Track and manage your maintenance requests
          </p>
        </div>
        <Link
          to="/resident/complaints/new"
          className="inline-flex items-center justify-center px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-bold shadow-lg shadow-sky-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Raise New Complaint
        </Link>
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
                placeholder="Search by ID, category, or description..."
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
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-sky-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700 font-medium"
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters({ ...filters, priority: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center text-sm font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-1.5" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="mb-6 pl-1">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredComplaints.length} of {complaints.length} complaints
          </p>
        </div>
      )}

      {/* Complaints Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-6 border border-slate-100 shadow-sm">
            <NewspaperIcon className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            {hasActiveFilters ? 'No complaints found' : 'No complaints yet'}
          </h3>
          <p className="text-slate-500 mb-8 font-medium max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms to find what you need.'
              : 'It looks like you haven\'t raised any complaints yet. Everything must be running smoothly!'}
          </p>
          {!hasActiveFilters && (
            <Link
              to="/resident/complaints/new"
              className="inline-flex items-center px-8 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-bold shadow-lg shadow-sky-200 hover:-translate-y-1"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Raise First Complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintList;