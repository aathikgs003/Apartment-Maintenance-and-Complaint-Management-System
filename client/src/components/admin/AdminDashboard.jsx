import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { analyticsService } from '../../services/analyticsService';
import { complaintService } from '../../services/complaintService';
import { CardSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Line,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Cell,
  LineChart,
} from 'recharts';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [complaintsTrend, setComplaintsTrend] = useState([]);
  const [trendDays, setTrendDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTrendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendDays]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        dashboardStats,
        recentComplaintsData,
        categoryData,
      ] = await Promise.all([
        analyticsService.getDashboardStats(),
        complaintService.getRecentComplaints({ limit: 5 }),
        analyticsService.getCategoryAnalytics(),
      ]);

      // API responses are shaped as { success, message, data: { ... } }
      setStats(dashboardStats?.data?.data ?? dashboardStats?.data ?? null);
      setRecentComplaints(recentComplaintsData?.data?.data?.complaints ?? recentComplaintsData?.data?.complaints ?? []);
      setCategoryStats(categoryData?.data?.data?.categories ?? categoryData?.data?.categories ?? []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      setTrendLoading(true);
      const trendData = await analyticsService.getComplaintsTrend({ days: trendDays });
      setComplaintsTrend(trendData?.data?.data?.trend ?? trendData?.data?.trend ?? []);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      toast.error('Failed to load trend data');
    } finally {
      setTrendLoading(false);
    }
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      subtext: `${stats?.users?.residents || 0} Residents, ${stats?.users?.staff || 0
        } Staff`,
      icon: UsersIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/users',
    },
    {
      title: 'Total Complaints',
      value: stats?.complaints?.total || 0,
      subtext: `${stats?.complaints?.active || 0} Active`,
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/admin/complaints',
    },
    {
      title: 'Delayed Complaints',
      value: stats?.delayedCount || 0,
      subtext: `${stats?.complaints?.delayPercentage || 0}% of active`,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/admin/delays',
    },
    {
      title: 'Avg Resolution Time',
      value: `${Math.round(stats?.complaints?.avgResolutionTime || 0)}h`,
      subtext: 'Average time to complete',
      icon: ClockIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/admin/analytics',
    },
  ];

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Assigned: 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-purple-100 text-purple-800',
      Completed: 'bg-green-100 text-green-800',
      Closed: 'bg-gray-100 text-gray-800',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-500 text-lg">
          Welcome back, {user?.name}! Here's your system overview.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                to={card.link}
                className="dashboard-card p-6 hover:shadow-md hover:border-sky-200 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                  {/* Subtle indicator dot */}
                  <div className={`h-2 w-2 rounded-full ${card.color} opacity-50`} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  {card.value}
                </h3>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  {card.title}
                </p>
                <div className="mt-3 flex items-center text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg w-fit">
                  {card.subtext}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 to-blue-600 rounded-[2rem] shadow-xl p-8 mb-10 text-white">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
            <p className="text-sky-100 max-w-xl">
              Manage your apartment maintenance system efficiently with these shortcuts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/users/new"
              className="inline-flex items-center px-5 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-bold shadow-sm"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add User
            </Link>
            <Link
              to="/admin/complaints"
              className="inline-flex items-center px-5 py-3 bg-blue-700/50 text-white rounded-xl hover:bg-blue-700/70 transition-colors font-semibold backdrop-blur-md border border-white/20"
            >
              Manage Complaints
            </Link>
            <Link
              to="/admin/analytics"
              className="inline-flex items-center px-5 py-3 bg-blue-700/50 text-white rounded-xl hover:bg-blue-700/70 transition-colors font-semibold backdrop-blur-md border border-white/20"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Complaints Trend Chart */}
        {!loading && complaintsTrend.length > 0 && (
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-sky-500" />
                Complaints Trend
              </h3>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                disabled={trendLoading}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
            <div className={`bg-slate-50/50 rounded-2xl p-2 ${trendLoading ? 'opacity-50' : ''}`}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={complaintsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#0EA5E9" /* Sky 500 */
                    name="Created"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10B981" /* Emerald 500 */
                    name="Resolved"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category Distribution */}
        {!loading && categoryStats.length > 0 && (
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-sky-500" />
              Complaints by Category
            </h3>
            <div className="flex items-center justify-center bg-slate-50/50 rounded-2xl p-2 h-[296px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                  >
                    {categoryStats.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Complaints Table */}
      {!loading && (
        <div className="dashboard-card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">
              Recent Complaints
            </h3>
            <Link
              to="/admin/complaints"
              className="text-sm text-sky-600 hover:text-sky-700 font-bold"
            >
              View All →
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-slate-50 p-4 rounded-full inline-block mb-3">
                <ClipboardDocumentListIcon className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No complaints yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      ID
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
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {recentComplaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {complaint.complaintId}
                        </div>
                        {complaint.isDelayed && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 mt-1">
                            Delayed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                          {complaint.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">
                            {complaint.residentId?.name?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {complaint.residentId?.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              Flat {complaint.residentId?.flatNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            complaint.priority
                          )}`}
                        >
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/admin/complaints/${complaint._id}`}
                          className="text-sky-600 hover:text-sky-800 font-semibold hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Today's Summary */}
      {!loading && stats?.today && (
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2rem] p-8 border border-emerald-100/50">
          <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center">
            <CheckCircleIcon className="h-6 w-6 mr-2 text-emerald-500" />
            Today's Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
              <p className="text-3xl font-black text-emerald-600">
                {stats.today.created}
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">New Complaints</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
              <p className="text-3xl font-black text-emerald-600">
                {stats.today.assigned}
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Assigned</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
              <p className="text-3xl font-black text-emerald-600">
                {stats.today.resolved}
              </p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Resolved</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;