import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { TableSkeleton } from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const ROLES = ['resident', 'staff', 'admin'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      // Server responds with { success, message, data: { users, pagination } }
      const users = response?.data?.data?.users ?? response?.data?.users ?? response?.data ?? [];
      setUsers(users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userService.toggleUserStatus(userId);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (userId, userName) => {
    if (!window.confirm(`Reset password for ${userName}?`)) return;

    try {
      const newPassword = 'TempPass@123';
      await userService.resetPassword(userId, newPassword);
      toast.success(`Password reset to: ${newPassword}`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await userService.deleteUser(selectedUser._id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === '' || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === '' ||
      (selectedStatus === 'active' ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-50 text-purple-700 border border-purple-100',
      staff: 'bg-blue-50 text-blue-700 border border-blue-100',
      resident: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    };
    return colors[role] || colors.resident;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="mt-2 text-slate-500 text-lg">
              Manage residents, staff, and admin users
            </p>
          </div>
          <Link
            to="/admin/users/new"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </Link>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-3xl font-black text-slate-800">{users.length}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mt-1">Total Users</p>
            </div>
            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-3xl font-black text-emerald-600">
                {users.filter((u) => u.role === 'resident').length}
              </p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mt-1">Residents</p>
            </div>
            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-3xl font-black text-blue-600">
                {users.filter((u) => u.role === 'staff').length}
              </p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mt-1">Staff</p>
            </div>
            <div className="dashboard-card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-3xl font-black text-purple-600">
                {users.filter((u) => u.role === 'admin').length}
              </p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide mt-1">Admins</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="dashboard-card bg-white p-5 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-600 font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-5 py-3 rounded-xl font-bold transition-all border ${showFilters
                ? 'bg-sky-50 text-sky-700 border-sky-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Role Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 font-medium"
                  >
                    <option value="">All Roles</option>
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 font-medium"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {!loading && (
          <div className="mb-4 text-sm font-medium text-slate-500 ml-1">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : filteredUsers.length === 0 ? (
          <div className="dashboard-card p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCircleIcon className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No users found
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              {searchTerm || selectedRole || selectedStatus
                ? 'We couldn\'t find any users matching your filters. Try adjusting them.'
                : 'Get started by adding your first user to the system.'}
            </p>
            {!(searchTerm || selectedRole || selectedStatus) && (
              <Link
                to="/admin/users/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First User
              </Link>
            )}
          </div>
        ) : (
          <div className="dashboard-card overflow-hidden bg-white shadow-xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profileImage ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                src={user.profileImage}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 ring-2 ring-white">
                                <UserCircleIcon className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900">
                              {user.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 flex items-center mb-1">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-slate-400" />
                          {user.email}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2 text-slate-400" />
                          {user.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'resident' && user.flatNumber && (
                          <div className="text-sm text-slate-700 flex items-center font-medium">
                            <HomeIcon className="h-4 w-4 mr-2 text-slate-400" />
                            Flat {user.flatNumber}
                          </div>
                        )}
                        {user.role === 'staff' && user.expertise && user.expertise.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.expertise.slice(0, 2).map((exp, i) => (
                              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {exp}
                              </span>
                            ))}
                            {user.expertise.length > 2 && (
                              <span className="text-xs text-slate-400">+{user.expertise.length - 2}</span>
                            )}
                          </div>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-xs text-slate-400 font-medium italic">Full Access</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors border ${user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                            }`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/admin/users/edit/${user._id}`}
                            className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleResetPassword(user._id, user.name)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Reset Password"
                          >
                            <LockClosedIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100">
            <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mb-4 mx-auto">
              <TrashIcon className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              Delete User?
            </h3>
            <p className="text-slate-500 text-center mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-700">{selectedUser.name}</span>?
              This action cannot be undone and will remove all their data.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;