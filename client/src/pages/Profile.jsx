import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Profile Header Card */}
      <div className="dashboard-card overflow-hidden bg-white mb-8 group relative">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-r from-sky-400 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-16 mb-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-300">
                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>

            <div className="flex gap-3 mb-2">
              <button
                onClick={() => navigate('/settings')}
                className="px-5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Edit Profile
              </button>
              <button
                onClick={() => logout()}
                className="px-5 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-bold hover:bg-rose-100 hover:text-rose-700 transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{user.name}</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              {user.email}
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-sky-600 font-bold capitalize bg-sky-50 px-2 py-0.5 rounded text-xs border border-sky-100">{user.role}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 2.25V4.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone Number</p>
                <p className="text-slate-700 font-semibold mt-0.5">{user.phone || 'Not provided'}</p>
              </div>
            </div>



            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Member Since</p>
                <p className="text-slate-700 font-semibold mt-0.5">{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info / stats could go here */}
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-sky-900">Need Help?</h3>
          <p className="text-sky-700/80 text-sm mt-1">Check our help center or contact support if you have issues.</p>
        </div>
        <button
          onClick={() => navigate('/help')}
          className="px-5 py-2.5 bg-white text-sky-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
        >
          Visit Help Center
        </button>
      </div>
    </div>
  );
};

export default Profile;
