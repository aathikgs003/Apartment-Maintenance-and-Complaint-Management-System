import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import GoogleButton from '../components/common/GoogleButton';

import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || `/${user.role}/dashboard`;
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Login successful!');
        const from = location.state?.from?.pathname || `/${result.user.role}/dashboard`;
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || 'Login failed');
        setErrors({ general: result.message });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };



  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 h-16 w-16 border-4 border-transparent border-b-primary-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-sky-50 via-white to-sky-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-slide-up">

        {/* Left Side - Branding (Visible on Desktop) */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-sky-600 to-blue-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {t('system_live')}
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-6">
              {t('modern_maintenance')} <br />
              <span className="text-sky-200">{t('simplified')}</span>
            </h2>
            <p className="text-sky-100 text-lg opacity-90 max-w-sm">
              {t('elite_platform')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-sky-200 uppercase tracking-widest mt-1">{t('support_24_7')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold">Fast</p>
              <p className="text-xs text-sky-200 uppercase tracking-widest mt-1">{t('fast_sla')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-sky-200 uppercase tracking-widest mt-1">{t('100_percent_digital')}</p>
            </div>
          </div>

          {/* Abstract Circle decorations */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 border-[30px] border-white/5 rounded-full blur-sm"></div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-8 sm:p-12 bg-white relative">
          <div className="max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-sky-600 p-2 rounded-xl shadow-lg">
                  <HomeIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-800">{t('app_name')}</span>
              </div>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2">{t('welcome_back_title')}</h1>
              <p className="text-slate-500">{t('manage_workspace')}</p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center text-rose-700 text-sm animate-shake">
                <ExclamationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label text-slate-700">{t('email')}</label>
                <div className="relative group">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 ${errors.email ? 'border-rose-400 ring-rose-100' : ''}`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-rose-600 font-medium ml-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label text-slate-700 mb-0">{t('password')}</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                    {t('forgot_password')}
                  </Link>
                </div>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-slate-900 placeholder:text-slate-400 ${errors.password ? 'border-rose-400 ring-rose-100' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-rose-600 font-medium ml-1">{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]">
                {loading ? t('processing') : t('sign_in')}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-medium tracking-widest">{t('or_continue_with')}</span></div>
              </div>

              <div className="hover:scale-[1.02] transition-transform active:scale-[0.98]">
                <GoogleButton />
              </div>
            </form>

            <p className="mt-8 text-center text-slate-600 text-sm">
              {t('new_here')} <Link to="/register" className="font-bold text-sky-600 hover:underline">{t('create_account_link')}</Link>
            </p>

            {/* Demo credentials removed for production */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;