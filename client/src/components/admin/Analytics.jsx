import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { CardSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [dashboardStats, setDashboardStats] = useState(null);
  const [complaintsTrend, setComplaintsTrend] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [delayAnalytics, setDelayAnalytics] = useState(null);
  const [ratingAnalytics, setRatingAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');



  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch main analytics in parallel, but get delay analytics separately
      const [dashboardData, trendData, categoryData, staffData, ratingData] =
        await Promise.all([
          analyticsService.getDashboardStats(dateRange),
          analyticsService.getComplaintsTrend({ days: 30 }),
          analyticsService.getCategoryAnalytics(dateRange),
          analyticsService.getStaffPerformance(dateRange),
          analyticsService.getRatingAnalytics(),
        ]);

      // Server responses are { success, message, data: { ... } }
      setDashboardStats(dashboardData.data?.data || {});
      setComplaintsTrend(trendData.data?.data?.trend || trendData.data?.trend || []);
      setCategoryStats(categoryData.data?.data?.categories || categoryData.data?.categories || []);
      setStaffPerformance(staffData.data?.data?.staff || staffData.data?.staff || []);
      setRatingAnalytics(ratingData.data?.data || ratingData.data || {});

      try {
        const delayData = await analyticsService.getDelayAnalytics();
        setDelayAnalytics(delayData.data?.data || delayData.data || {});
      } catch (err) {
        console.error('Error fetching delay analytics:', err);
        setDelayAnalytics({});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartPieIcon },
    { id: 'trends', name: 'Trends', icon: ArrowTrendingUpIcon },
    { id: 'staff', name: 'Staff Performance', icon: UsersIcon },
    { id: 'delays', name: 'Delay Analysis', icon: ExclamationTriangleIcon },
    { id: 'ratings', name: 'Ratings', icon: StarIcon },
  ];

  // Status distribution for pie chart
  const statusDistribution = dashboardStats
    ? [
      { name: 'Pending', value: dashboardStats.complaints?.pending || 0, color: '#fbbf24' },
      { name: 'Assigned', value: dashboardStats.complaints?.assigned || 0, color: '#38bdf8' },
      { name: 'In Progress', value: dashboardStats.complaints?.inProgress || 0, color: '#818cf8' },
      { name: 'Completed', value: dashboardStats.complaints?.completed || 0, color: '#34d399' },
      { name: 'Closed', value: dashboardStats.complaints?.closed || 0, color: '#94a3b8' },
    ].filter((item) => item.value > 0)
    : [];

  // Priority distribution
  const priorityDistribution = dashboardStats?.priorityDistribution
    ? [
      { name: 'High', value: dashboardStats.priorityDistribution.High || 0, color: '#f87171' },
      { name: 'Medium', value: dashboardStats.priorityDistribution.Medium || 0, color: '#fbbf24' },
      { name: 'Low', value: dashboardStats.priorityDistribution.Low || 0, color: '#34d399' },
    ].filter((item) => item.value > 0)
    : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="mt-2 text-slate-500 text-lg">
            Comprehensive insights into your maintenance operations
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <CalendarIcon className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="py-1 px-2 border-0 focus:ring-0 text-slate-600 bg-transparent text-sm font-medium"
          />
          <span className="text-slate-300 font-bold">→</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="py-1 px-2 border-0 focus:ring-0 text-slate-600 bg-transparent text-sm font-medium"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 p-1 bg-slate-100 rounded-xl inline-flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${isActive
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total</span>
              </div>
              <h3 className="text-3xl font-black text-slate-800">{dashboardStats?.complaints?.total || 0}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Total Complaints</p>
            </div>

            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Success</span>
              </div>
              <h3 className="text-3xl font-black text-emerald-600">{dashboardStats?.complaints?.resolved || 0}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Resolved</p>
            </div>

            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Warning</span>
              </div>
              <h3 className="text-3xl font-black text-rose-600">{dashboardStats?.delayedCount || 0}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Delayed</p>
              <div className="mt-2 w-full bg-rose-100 rounded-full h-1.5">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(dashboardStats?.complaints?.delayPercentage || 0, 100)}%` }}></div>
              </div>
              <p className="text-xs text-rose-500 mt-1 font-semibold">{dashboardStats?.complaints?.delayPercentage || 0}% rate</p>
            </div>

            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Speed</span>
              </div>
              <h3 className="text-3xl font-black text-slate-800">{Math.round(dashboardStats?.complaints?.avgResolutionTime || 0)}h</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Avg Resolution Time</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Status Distribution */}
            <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Status Distribution</h3>
              <div className="h-80">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No data available</div>
                )}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Complaints by Category</h3>
              <div className="h-80">
                {categoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Priority Distribution</h3>
            <div className="grid grid-cols-3 gap-6">
              {priorityDistribution.map((item) => (
                <div
                  key={item.name}
                  className="text-center p-6 rounded-2xl transition-transform hover:scale-105"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <p className="text-4xl font-black mb-1" style={{ color: item.color }}>
                    {item.value}
                  </p>
                  <p className="text-sm font-bold uppercase tracking-wide opacity-70" style={{ color: item.color }}>{item.name} Priority</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Complaints Trend */}
          <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Complaints Trend (Last 30 Days)</h3>
            <div className="h-96">
              {complaintsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={complaintsTrend}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                      axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), 'PPP')}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCreated)"
                      name="Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">No trend data available</div>
              )}
            </div>
          </div>

          {/* Category Trend */}
          <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Category-wise Resolution Rate</h3>
            <div className="h-80">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis dataKey="category" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                    <Bar
                      dataKey="resolutionRate"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      name="Resolution Rate"
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Performance Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="dashboard-card p-6 bg-white shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Staff</p>
              <p className="text-4xl font-black text-slate-800">{staffPerformance.length}</p>
            </div>
            <div className="dashboard-card p-6 bg-white shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Avg Completion Rate</p>
              <p className="text-4xl font-black text-sky-600">
                {staffPerformance.length > 0
                  ? (staffPerformance.reduce((sum, s) => sum + (s.completionRate || 0), 0) / staffPerformance.length).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="dashboard-card p-6 bg-white shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Avg Rating</p>
              <div className="flex items-end">
                <p className="text-4xl font-black text-amber-500 mr-2">
                  {staffPerformance.length > 0
                    ? (
                      staffPerformance.filter((s) => s.averageRating > 0).reduce((sum, s) => sum + s.averageRating, 0) /
                      (staffPerformance.filter((s) => s.averageRating > 0).length || 1)
                    ).toFixed(1)
                    : 0}
                </p>
                <div className="pb-2">
                  <StarIconSolid className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Staff Performance Table */}
          <div className="dashboard-card overflow-hidden bg-white shadow-xl shadow-slate-200/50">
            <div className="px-8 py-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Staff Performance</h3>
            </div>
            {staffPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Member</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Expertise</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rate</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {staffPerformance.map((staff) => (
                      <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">{staff.name}</div>
                          <div className="text-xs text-slate-500">{staff.email}</div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {staff.expertise?.slice(0, 2).map((exp, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                                {exp}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-slate-700">{staff.totalAssigned || 0}</td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{staff.completed || 0}</td>
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-20 h-2 bg-slate-100 rounded-full mr-3">
                              <div
                                className="h-2 bg-emerald-500 rounded-full shadow-sm"
                                style={{ width: `${staff.completionRate || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{staff.completionRate || 0}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-600">{staff.avgResolutionTime || 0}h</td>
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg w-fit">
                            <span className="text-sm font-bold text-amber-700 mr-1">{staff.averageRating?.toFixed(1) || 0}</span>
                            <StarIconSolid className="h-4 w-4 text-amber-400" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400 font-medium">No staff performance data available</div>
            )}
          </div>
        </div>
      )}

      {/* Delays Tab */}
      {activeTab === 'delays' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Delay Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="dashboard-card p-6 bg-red-50 border border-red-100">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Total Delayed</p>
              <p className="text-4xl font-black text-red-600">{delayAnalytics?.duration?.totalDelayed || 0}</p>
            </div>
            <div className="dashboard-card p-6 bg-orange-50 border border-orange-100">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1">Avg Delay Hours</p>
              <p className="text-4xl font-black text-orange-600">{Math.round(delayAnalytics?.duration?.avgDelayHours || 0)}h</p>
            </div>
            <div className="dashboard-card p-6 bg-amber-50 border border-amber-100">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-1">Max Delay Hours</p>
              <p className="text-4xl font-black text-amber-600">{Math.round(delayAnalytics?.duration?.maxDelayHours || 0)}h</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Delays by Category */}
            <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Delays by Category</h3>
              <div className="h-80">
                {delayAnalytics?.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={delayAnalytics.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#fef2f2' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} name="Delayed Complaints" barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium">No delay data available</div>
                )}
              </div>
            </div>

            {/* Delays by Staff */}
            <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Delays by Staff</h3>
              <div className="overflow-y-auto max-h-80 pr-2 space-y-3">
                {delayAnalytics?.byStaff?.length > 0 ? (
                  delayAnalytics.byStaff.slice(0, 10).map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 font-bold shadow-sm">
                          {staff.staffName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{staff.staffName}</p>
                          <p className="text-xs text-slate-400">{staff.staffEmail}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                        {staff.count} delayed
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium py-12">No delay data by staff</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ratings Tab */}
      {activeTab === 'ratings' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Rating Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="dashboard-card p-6 bg-white shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total Ratings</p>
              <p className="text-4xl font-black text-slate-800">{ratingAnalytics?.overall?.totalRatings || 0}</p>
            </div>
            <div className="dashboard-card p-6 bg-amber-50/50 border border-amber-100">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">Combined Average</p>
              <div className="flex items-end">
                <p className="text-4xl font-black text-amber-600 mr-2">{ratingAnalytics?.overall?.averageRating || 0}</p>
                <div className="pb-2">
                  <StarIconSolid className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </div>
            <div className="dashboard-card p-6 bg-emerald-50/50 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">5-Star Excellence</p>
              <p className="text-4xl font-black text-emerald-600">{ratingAnalytics?.overall?.distribution?.[5] || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rating Distribution */}
            <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Rating Distribution</h3>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingAnalytics?.overall?.distribution?.[star] || 0;
                  const total = ratingAnalytics?.overall?.totalRatings || 1;
                  const percentage = ((count / total) * 100).toFixed(1);

                  return (
                    <div key={star} className="flex items-center group">
                      <div className="flex items-center w-16">
                        <span className="text-sm font-bold text-slate-600 mr-1">{star}</span>
                        <StarIconSolid className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full mx-3 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out group-hover:bg-amber-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-xs font-bold text-slate-500">
                          {count} <span className="text-slate-300">|</span> {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Ratings */}
            <div className="dashboard-card p-6 bg-white shadow-xl shadow-slate-200/50">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Feedback</h3>
              <div className="overflow-y-auto max-h-[400px] pr-2 space-y-4">
                {ratingAnalytics?.recent?.length > 0 ? (
                  ratingAnalytics.recent.slice(0, 5).map((rating, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIconSolid key={i} className={`h-3.5 w-3.5 ${i < rating.rating ? 'text-amber-400' : 'text-slate-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-400">{rating.residentId?.name || 'Resident'}</span>
                      </div>

                      {rating.feedback && (
                        <p className="text-sm text-slate-700 italic mb-3">"{rating.feedback}"</p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Staff:</span>
                          <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">{rating.staffId?.name}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-300">#{rating.complaintId?.complaintId}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 font-medium">No recent ratings</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;