import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import Loader from '../common/Loader';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, StarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const res = await userService.getUserById(id);

        // Support different response shapes
        const data = res?.data?.data;
        const fetchedUser = data?.user || data || res?.data || null;
        const fetchedStats = data?.stats || null;

        if (!fetchedUser) {
          toast.error('Staff not found');
          setStaff(null);
        } else {
          setStaff({ ...fetchedUser, stats: fetchedStats });
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        const message = err?.response?.data?.message || err.message || 'Failed to fetch staff';
        toast.error(message);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [id]);

  if (loading) return <Loader />;

  if (!staff) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">Staff Member Not Found</h2>
          <p className="text-slate-500 mt-2">The staff member you are looking for does not exist or you don't have permission to view their profile.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate rating display
  const averageRating = staff.stats?.ratings?.averageRating || staff.stats?.ratings || 0;
  const totalRatings = staff.stats?.ratings?.count || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-600 mb-6 transition-colors group"
      >
        <ArrowLeftIcon className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="dashboard-card bg-white overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="h-32 bg-gradient-to-br from-sky-500 to-blue-600"></div>
            <div className="px-6 pb-6 text-center -mt-16">
              <div className="relative inline-block">
                {staff.profileImage ? (
                  <img
                    src={staff.profileImage}
                    alt={staff.name}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-slate-400 font-bold text-4xl shadow-md">
                    {staff.name?.charAt(0) || 'S'}
                  </div>
                )}
                <div className={`absolute bottom-2 right-2 h-5 w-5 border-2 border-white rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-3">{staff.name}</h2>
              <p className="text-sky-600 font-medium text-sm mb-4">
                {Array.isArray(staff.expertise) && staff.expertise.length > 0 ? staff.expertise.join(', ') : 'Staff Member'}
              </p>

              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  i < Math.round(averageRating) ?
                    <StarIconSolid key={i} className="h-5 w-5 text-amber-400" /> :
                    <StarIcon key={i} className="h-5 w-5 text-slate-300" />
                ))}
                <span className="text-xs text-slate-400 font-semibold ml-1">({totalRatings})</span>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                    <EnvelopeIcon className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                    <p className="text-sm font-medium text-slate-700 truncate" title={staff.email}>{staff.email}</p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                    <PhoneIcon className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Phone</p>
                    <p className="text-sm font-medium text-slate-700">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="dashboard-card p-5 bg-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tasks Completed</p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {staff.stats?.complaints?.completed ?? staff.stats?.completed ?? 0}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="dashboard-card p-5 bg-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {staff.stats?.complaints?.pending ?? staff.stats?.pending ?? 0}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <ClipboardDocumentListIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="dashboard-card p-5 bg-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Rating</p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {averageRating ? Number(averageRating).toFixed(1) : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <StarIcon className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Bio / About Section */}
          <div className="dashboard-card p-8 bg-white shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">About Staff Member</h3>
            <p className="text-slate-600 leading-relaxed">
              {staff.bio || `No biography provided for ${staff.name}. This section is waiting to be filled.`}
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Joined Date</p>
                <p className="text-sm font-semibold text-slate-700">
                  {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Employee ID</p>
                <p className="text-sm font-semibold text-slate-700 tracking-wider">
                  {staff._id ? staff._id.substring(staff._id.length - 8).toUpperCase() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
