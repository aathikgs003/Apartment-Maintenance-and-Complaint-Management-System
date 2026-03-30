import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import Loader, { TableSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';

const WorkHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const CATEGORIES = COMPLAINT_CATEGORIES;

  useEffect(() => {
    fetchWorkHistory();
  }, []);

  const fetchWorkHistory = async () => {
    try {
      setLoading(true);
      // Fetch completed/closed complaints assigned to this staff
      const response = await complaintService.getMyAssignedComplaints({
        status: 'Completed,Closed',
      });
      setHistory(response.data.data.complaints || []);
    } catch (error) {
      console.error('Error fetching work history:', error);
      toast.error('Failed to load work history');
    } finally {
      setLoading(false);
    }
  };

  // Filter history
  const filteredHistory = history.filter((complaint) => {
    const matchesSearch =
      searchTerm === '' ||
      complaint.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.residentId?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === '' || complaint.category === selectedCategory;

    const matchesDateRange =
      (!dateRange.startDate ||
        new Date(complaint.completedAt) >= new Date(dateRange.startDate)) &&
      (!dateRange.endDate ||
        new Date(complaint.completedAt) <= new Date(dateRange.endDate));

    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Calculate statistics
  const stats = {
    total: filteredHistory.length,
    avgResolutionTime:
      filteredHistory.length > 0
        ? (
          filteredHistory.reduce(
            (sum, c) => sum + (c.resolutionTime || 0),
            0
          ) / filteredHistory.length
        ).toFixed(1)
        : 0,
    avgRating:
      filteredHistory.filter((c) => c.rating).length > 0
        ? (
          filteredHistory
            .filter((c) => c.rating)
            .reduce((sum, c) => sum + c.rating.rating, 0) /
          filteredHistory.filter((c) => c.rating).length
        ).toFixed(1)
        : 0,
    rated: filteredHistory.filter((c) => c.rating).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Work History</h1>
        <p className="mt-2 text-lg text-slate-500">
          Track your performance and completed tasks
        </p>
      </div>

      {/* Statistics Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 p-6 text-white transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-4xl font-black mb-1">{stats.total}</h3>
            <p className="text-emerald-100 font-bold text-sm uppercase tracking-wide">Tasks Completed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-1">
              {stats.avgResolutionTime}<span className="text-xl text-slate-400 font-medium ml-1">h</span>
            </h3>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Avg Resolution</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:border-amber-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform">
                <StarIcon className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-1">
              {stats.avgRating}
            </h3>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Average Rating</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 group hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg group-hover:scale-110 transition-transform">
                <StarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.rated}</h3>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">Rated Works</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by ID, category, or resident..."
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
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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

            {/* Date Range */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700 font-medium"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-700 font-medium"
              />
              {(selectedCategory || dateRange.startDate || dateRange.endDate) && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setDateRange({ startDate: '', endDate: '' });
                  }}
                  className="absolute right-0 top-0 text-xs text-rose-500 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {!loading && (
        <div className="mb-4 text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">
          Showing {filteredHistory.length} of {history.length} completed tasks
        </div>
      )}

      {/* History Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-16 text-center">
          <CheckCircleIcon className="h-16 w-16 text-slate-300 mx-auto mb-6" />
          <h3 className="text-xl font-black text-slate-900 mb-2">
            No history found
          </h3>
          <p className="text-slate-500 font-medium">
            {searchTerm || selectedCategory || dateRange.startDate
              ? 'Try adjusting your filters to find past work.'
              : 'Your completed work history will appear here once you finish some tasks.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Complaint ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Completed On
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Resolution Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {filteredHistory.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 font-mono bg-slate-100 inline-block px-2 py-1 rounded-md">
                        {complaint.complaintId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
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
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                        {format(new Date(complaint.completedAt), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">
                        {complaint.resolutionTime}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {complaint.rating ? (
                        <div className="flex items-center">
                          <div className="flex bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <StarIconSolid
                                key={index}
                                className={`h-3.5 w-3.5 ${index < complaint.rating.rating
                                    ? 'text-amber-400'
                                    : 'text-amber-200'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm font-bold text-amber-900">
                            {complaint.rating.rating}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 italic">Not rated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/staff/complaints/${complaint._id}`}
                        className="text-sky-600 hover:text-sky-800 font-bold hover:underline"
                      >
                        View Details
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

export default WorkHistory;