import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import {
  HomeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define menu items based on role
  const menuItems = {
    resident: [
      { name: t('dashboard'), path: '/resident/dashboard', icon: HomeIcon },
      { name: t('my_complaints'), path: '/resident/complaints', icon: ClipboardDocumentListIcon },
      { name: t('new_complaint'), path: '/resident/complaints/new', icon: BellIcon },
    ],
    staff: [
      { name: t('dashboard'), path: '/staff/dashboard', icon: HomeIcon },
      { name: t('assigned_complaints'), path: '/staff/complaints', icon: ClipboardDocumentListIcon },
      { name: t('work_history'), path: '/staff/history', icon: ChartBarIcon },
    ],
    admin: [
      { name: t('dashboard'), path: '/admin/dashboard', icon: HomeIcon },
      { name: t('users'), path: '/admin/users', icon: UserGroupIcon },
      { name: t('complaints'), path: '/admin/complaints', icon: ClipboardDocumentListIcon, badge: 'New' },
      { name: t('analytics'), path: '/admin/analytics', icon: ChartBarIcon },
      { name: t('delays'), path: '/admin/delays', icon: ExclamationTriangleIcon, badge: '!' },
    ]
  };

  const currentMenu = menuItems[user?.role] || [];

  return (
    <aside
      className={`h-screen sticky top-0 sidebar transition-all duration-300 flex flex-col z-50 ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      {/* --- LOGO SECTION --- */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold brand-name tracking-tight text-slate-800">AMS Pro</span>
          </div>
        )}
        {isCollapsed && (
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl mx-auto shadow-lg shadow-sky-500/20">
            <HomeIcon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* --- SEARCH BAR (Hidden when collapsed) --- */}
      {!isCollapsed && (
        <div className="px-6 mb-6 animate-fade-in">
          <div className="relative group">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input
              type="text"
              placeholder={t('search')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* --- NAVIGATION LINKS --- */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {currentMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <item.icon className={`h-6 w-6 shrink-0 transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />

              {!isCollapsed && (
                <span className={`font-semibold whitespace-nowrap animate-fade-in ${isActive ? 'text-sky-900' : ''}`}>
                  {item.name}
                </span>
              )}

              {/* Badges */}
              {item.badge && !isCollapsed && (
                <span className={`ml-auto px-2 py-0.5 rounded-md text-[10px] font-bold uppercase
                  ${item.badge === '!' ? 'bg-rose-100 text-rose-600' : 'bg-sky-100 text-sky-600'}`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip for Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl font-medium">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- BOTTOM SECTION --- */}
      <div className="p-4 mt-auto border-t border-border-default space-y-2">
        {/* Profile (Optional) */}
        {!isCollapsed && (
          <div
            onClick={() => navigate('/profile')}
            role="button"
            tabIndex={0}
            className="px-4 py-3 mb-2 rounded-2xl flex items-center gap-3 cursor-pointer sidebar-profile"
            style={{ background: 'transparent' }}
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-10 w-10 rounded-full border-2 border-primary-500 object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-500 text-on-inverse flex items-center justify-center font-bold">
                {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
              </div>
            )}

            <div className="overflow-hidden">
              <p className="text-sm font-bold text-on-inverse truncate sidebar-profile-name">{user?.name}</p>
              <p className="text-xs text-sidebar-muted capitalize sidebar-profile-role">{user?.role}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/settings'); }}
              className="ml-auto text-sidebar-muted hover:text-on-inverse"
              aria-label="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5 text-sidebar-muted" />
            </button>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all sidebar-link"
        >
          {isCollapsed ? <ChevronRightIcon className="h-6 w-6 mx-auto text-sidebar-muted" /> : (
            <>
              <ChevronLeftIcon className="h-6 w-6 text-sidebar-muted" />
              <span className="font-medium text-on-surface">{t('collapse')}</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all sidebar-link"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0 mx-auto lg:mx-0 text-sidebar-muted" />
          {!isCollapsed && <span className="font-medium text-on-surface">{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;