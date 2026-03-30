import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    return `/${user.role}/dashboard`;
  };

  const quickLinks = [
    { name: 'Home', path: '/', icon: HomeIcon },
    ...(user
      ? [
        { name: 'Dashboard', path: getDashboardLink(), icon: HomeIcon },
      ]
      : [
        { name: 'Login', path: '/login', icon: HomeIcon },
        { name: 'Register', path: '/register', icon: HomeIcon },
      ]),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* 404 Text */}
            <h1 className="text-[150px] md:text-[200px] font-black text-slate-200 leading-none select-none tracking-tighter">
              404
            </h1>

            {/* Animated Icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 shadow-2xl shadow-sky-500/30 animate-bounce">
                <ExclamationTriangleIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
            Oops! The page you're looking for doesn't exist or has been moved.
            Don't worry, let's get you back on track.
          </p>
        </div>

        {/* Search Box (Optional) */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              placeholder="Search for something..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-600 font-medium placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={goBack}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
          <Link
            to={getDashboardLink()}
            className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-sky-500/30 transition-all"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            {user ? 'Go to Dashboard' : 'Go Home'}
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-slate-100">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-5 py-2.5 bg-white rounded-lg border border-slate-200 text-slate-600 hover:border-sky-500 hover:text-sky-600 transition-colors text-sm font-bold shadow-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Fun Message */}
        <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto">
          <p className="text-slate-600 text-sm font-medium">
            💡 <strong>Did you know?</strong> You can always use the navigation
            menu to find your way around the apartment maintenance system.
          </p>
        </div>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 translate-y-1/2 -translate-x-1/2"></div>

      {/* CSS for blob animation */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;