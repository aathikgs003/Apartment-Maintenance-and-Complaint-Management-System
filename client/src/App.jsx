import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ThemeProvider from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';

// Common Components
import Sidebar from './components/common/Sidebar';
import NotificationBell from './components/common/NotificationBell';
import Footer from './components/common/Footer';
import Loader from './components/common/Loader';
import ChatWidget from './components/common/ChatWidget';
import ProfileCompletion from './components/common/ProfileCompletion';
import { useTranslation } from 'react-i18next';
import ProtectedRoute, { ResidentRoute, StaffRoute, AdminRoute } from './components/common/ProtectedRoute';
import ThemeToggle from './components/common/ThemeToggle';
import LanguageSelector from './components/common/LanguageSelector';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import About from './pages/About';
import Services from './pages/Services';
import FAQ from './pages/FAQ';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Disclaimer from './pages/Disclaimer';
import Cookies from './pages/Cookies';
import Contact from './pages/Contact';

// Resident Components
import ResidentDashboard from './components/resident/ResidentDashboard';
import ComplaintList from './components/resident/ComplaintList';
import ComplaintForm from './components/resident/ComplaintForm';
import ComplaintDetails from './components/resident/ComplaintDetails';

// Staff Components
import StaffDashboard from './components/staff/StaffDashboard';
import AssignedComplaintsList from './components/staff/AssignedComplaintsList';
import WorkHistory from './components/staff/WorkHistory';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import ComplaintManagement from './components/admin/ComplaintManagement';
import Analytics from './components/admin/Analytics';
import DelayMonitor from './components/admin/DelayMonitor';
import UserForm from './components/admin/UserForm';
import StaffProfile from './components/admin/StaffProfile';

// --- MAIN LAYOUT WRAPPER ---
const AppLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  // Compute a friendly header title. For complaint detail routes show "Complaint Details"
  const headerText = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const len = parts.length;
    const last = parts[len - 1];
    const prev = parts[len - 2];
    // Specific overrides
    if (prev === 'complaints') {
      if (last === 'new') return t('new_complaint');
      return t('complaint_details');
    }
    if (prev === 'users') {
      if (last === 'new') return t('add_user');
      // If it looks like an ID, show 'User Profile'
      if (last.length > 10) return t('user_profile');
    }
    if (prev === 'edit' && parts[len - 3] === 'users') return t('edit_user');

    if (last === 'complaints') {
      if (parts[0] === 'resident') return t('my_complaints');
      if (parts[0] === 'staff') return t('assigned_complaints');
      return t('complaints');
    }

    // Try to translate the key, fallback to capitalized string if translation equals key (which usually means missing)
    // Actually i18next returns key if missing.
    // Ideally we assume keys exist for main routes.
    // For 'dashboard', 'users', 'analytics', 'delays', 'history' we have keys.
    const key = last?.replace(/-/g, '_'); // e.g. delay-monitor -> delay_monitor? No.
    if (i18n.exists(key)) return t(key);

    // Simple fallback
    return t(key, { defaultValue: last?.replace(/-/g, ' ') });
  })();

  // Define routes where we DON'T want the sidebar (Auth & Landing)
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicPage = publicRoutes.includes(location.pathname);

  // While checking auth, show nothing or a loader to prevent flicker
  if (loading) return <Loader fullScreen />;

  // If user is not logged in OR it's a public landing page, show plain layout
  if (!user || isPublicPage) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        {children}
      </div>
    );
  }

    // Dashboard Layout with Sidebar (only if profile completed)
    const showSetup = user && !user.isProfileCompleted && user.role !== 'admin';

    return (
      <>
        {showSetup && <ProfileCompletion />}
        <div className={`flex h-screen bg-bg-primary overflow-hidden ${showSetup ? 'blur-[8px] pointer-events-none select-none grayscale-[0.05]' : 'animate-fade-in'}`}>
          {/* 1. Sidebar - Fixed on the left */}
      <Sidebar tone="dark" />
 
      {/* 2. Main Area - Scrolls on the right */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Inside Content Area) */}
        <header className="sticky top-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 shrink-0 z-30 shadow-sm transition-all">
          <h2 className="text-slate-800 font-bold text-lg capitalize tracking-tight">{headerText}</h2>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <NotificationBell />
            <ThemeToggle />
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700">{user.name}</p>
              <p className="text-xs text-sky-600 font-bold capitalize bg-sky-50 px-2 py-0.5 rounded-md inline-block mt-0.5">{user.role}</p>
            </div>
          </div>
        </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <Router>
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Resident Routes */}
                <Route path="/resident" element={<ResidentRoute><Navigate to="/resident/dashboard" /></ResidentRoute>} />
                <Route path="/resident/dashboard" element={<ResidentRoute><ResidentDashboard /></ResidentRoute>} />
                <Route path="/resident/complaints" element={<ResidentRoute><ComplaintList /></ResidentRoute>} />
                <Route path="/resident/complaints/new" element={<ResidentRoute><ComplaintForm /></ResidentRoute>} />
                <Route path="/resident/complaints/:id" element={<ResidentRoute><ComplaintDetails /></ResidentRoute>} />

                {/* Staff Routes */}
                <Route path="/staff" element={<StaffRoute><Navigate to="/staff/dashboard" /></StaffRoute>} />
                <Route path="/staff/dashboard" element={<StaffRoute><StaffDashboard /></StaffRoute>} />
                <Route path="/staff/complaints" element={<StaffRoute><AssignedComplaintsList /></StaffRoute>} />
                <Route path="/staff/complaints/:id" element={<StaffRoute><ComplaintDetails /></StaffRoute>} />
                <Route path="/staff/history" element={<StaffRoute><WorkHistory /></StaffRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><Navigate to="/admin/dashboard" /></AdminRoute>} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                <Route path="/admin/users/new" element={<AdminRoute><UserForm /></AdminRoute>} />
                <Route path="/admin/users/:id" element={<AdminRoute><StaffProfile /></AdminRoute>} />
                <Route path="/admin/users/edit/:id" element={<AdminRoute><UserForm /></AdminRoute>} />
                <Route path="/admin/complaints" element={<AdminRoute><ComplaintManagement /></AdminRoute>} />
                <Route path="/admin/complaints/:id" element={<AdminRoute><ComplaintDetails /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                <Route path="/admin/delays" element={<AdminRoute><DelayMonitor /></AdminRoute>} />

                {/* Shared Protected Routes */}
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Footer informational pages */}
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/help" element={<Help />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/contact" element={<Contact />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: '!bg-white !border !border-slate-200 !shadow-2xl !rounded-xl !text-slate-800 !font-medium',
                style: {
                  padding: '16px',
                  color: '#1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                },
              }}
            />
            <ChatWidget />
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;