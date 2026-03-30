import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    const commonItems = [
      { name: t('dashboard'), path: `/${user.role}/dashboard`, icon: HomeIcon },
    ];

    if (user.role === 'resident') {
      return [
        ...commonItems,
        {
          name: 'My Complaints',
          path: '/resident/complaints',
          icon: ClipboardDocumentListIcon,
        },
        {
          name: 'New Complaint',
          path: '/resident/complaints/new',
          icon: ClipboardDocumentListIcon,
        },
      ];
    }

    if (user.role === 'staff') {
      return [
        ...commonItems,
        {
          name: 'Assigned Complaints',
          path: '/staff/complaints',
          icon: ClipboardDocumentListIcon,
        },
        {
          name: 'Work History',
          path: '/staff/history',
          icon: ClipboardDocumentListIcon,
        },
      ];
    }

    if (user.role === 'admin') {
      return [
        ...commonItems,
        {
          name: t('users'),
          path: '/admin/users',
          icon: UserGroupIcon,
        },
        {
          name: t('complaints'),
          path: '/admin/complaints',
          icon: ClipboardDocumentListIcon,
        },
        {
          name: t('analytics'),
          path: '/admin/analytics',
          icon: ChartBarIcon,
        },
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => location.pathname === path;

  if (!user) {
    return null; // Don't show navbar on login/register pages
  }

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to={`/${user.role}/dashboard`} className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block leading-tight">
                  <h1 className="text-lg font-black text-slate-800 tracking-tight">SkyView</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${active
                      ? 'bg-sky-50 text-sky-600 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${active ? 'text-sky-500' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle (Hidden if we are enforcing light/saas theme, but keeping for logic) */}
              <div className="hidden">
                <ThemeToggle />
              </div>
              <LanguageSelector />

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
                >
                  <div className="hidden md:block text-right leading-tight">
                    <p className="text-sm font-bold text-slate-700">{user.name}</p>
                    <p className="text-xs text-sky-600 font-bold capitalize bg-sky-50 px-1.5 py-0.5 rounded-md inline-block">{user.role}</p>
                  </div>
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-white shadow-sm ring-1 ring-slate-100">
                      <UserCircleIcon className="h-6 w-6" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-3 border-b border-slate-50 mb-1">
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400 font-medium truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors mx-2 rounded-lg"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserCircleIcon className="h-4.5 w-4.5 mr-3 text-slate-400" />
                      My Profile
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors mx-2 rounded-lg"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Cog6ToothIcon className="h-4.5 w-4.5 mr-3 text-slate-400" />
                      Settings
                    </Link>

                    <div className="border-t border-slate-50 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors mx-2 rounded-lg mb-1"
                      >
                        <ArrowRightOnRectangleIcon className="h-4.5 w-4.5 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white shadow-lg">
            <div className="px-4 pt-3 pb-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-colors ${active
                      ? 'bg-sky-50 text-sky-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-sky-500' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;