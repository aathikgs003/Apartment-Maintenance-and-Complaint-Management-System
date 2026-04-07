import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  HomeModernIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  ExclamationCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import GoogleButton from '../components/common/GoogleButton';
import { COMPLAINT_CATEGORIES, STAFF_EXPERTISE } from '../utils/constants';

import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'resident',
    flatNumber: '',
    expertise: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  // Use server-aligned staff expertise options
  const EXPERTISE_OPTIONS = STAFF_EXPERTISE;

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const toggleExpertise = (exp) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(exp)
        ? prev.expertise.filter((e) => e !== exp)
        : [...prev.expertise, exp],
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid 10-digit mobile number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) newErrors.password = 'Include upper, lower, and number';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (formData.role === 'resident' && !formData.flatNumber.trim()) newErrors.flatNumber = 'Flat number is required';
    if (formData.role === 'staff' && formData.expertise.length === 0) newErrors.expertise = 'Select at least one expertise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
      };
      if (formData.role === 'resident') userData.flatNumber = formData.flatNumber.trim().toUpperCase();
      if (formData.role === 'staff') userData.expertise = formData.expertise;
      const result = await register(userData);
      if (result.success) {
        toast.success('Registration successful!');
        navigate(`/${result.user.role}/dashboard`, { replace: true });
      } else {
        toast.error(result.message || 'Registration failed');
        setErrors({ general: result.message });
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally { setLoading(false); }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    if (strength <= 2) return { label: t('weak'), color: 'bg-rose-500', width: '33%' };
    if (strength <= 4) return { label: t('medium'), color: 'bg-amber-500', width: '66%' };
    return { label: t('strong'), color: 'bg-emerald-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-16 w-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-sky-50 via-white to-sky-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-sky-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden animate-slide-up">

        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-sky-600 to-blue-700 p-12 text-white flex-col justify-between relative">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium mb-8">
              <HomeIcon className="h-4 w-4" /> {t('back_to_home')}
            </Link>
            <h2 className="text-4xl font-extrabold leading-tight mb-6">
              {t('join_smart_community')}
            </h2>
            <div className="space-y-5">
              {[
                { text: t('digital_complaint_registration'), icon: CheckIcon },
                { text: t('live_status_tracking'), icon: CheckIcon },
                { text: t('professional_staff'), icon: CheckIcon },
                { text: t('transparent_history'), icon: CheckIcon }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="bg-emerald-400/20 p-1 rounded-full">
                    <item.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium opacity-90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10">
            <p className="text-sm italic opacity-70">{t('resident_testimonial')}</p>
            <p className="text-xs font-bold mt-2">— {t('resident_label')}</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-8 sm:p-12 bg-white relative overflow-y-auto custom-scrollbar max-h-[90vh] lg:max-h-none">
          <div className="max-w-md mx-auto">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2">{t('create_account_title')}</h1>
              <p className="text-slate-500 text-sm">{t('step', { current: step, total: 2 })}: {step === 1 ? t('step_1_title') : t('step_2_title')}</p>

              {/* Stepper UI */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`}></div>
              </div>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center text-rose-700 text-sm">
                <ExclamationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <div className="space-y-5 animate-fade-in">
                  <div className="hover:scale-[1.02] transition-transform active:scale-[0.98] mb-6">
                    <GoogleButton />
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-medium tracking-widest">{t('or_continue_with')}</span></div>
                  </div>

                  <div>
                    <label className="form-label text-slate-700">{t('full_name')}</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-rose-600 font-medium ml-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="form-label text-slate-700">{t('email')}</label>
                    <div className="relative group">
                      <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium ml-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="form-label text-slate-700">{t('phone_number')}</label>
                    <div className="relative group">
                      <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-rose-600 font-medium ml-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="form-label text-slate-700 mb-3">{t('register_as')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'resident', label: t('resident_role'), icon: HomeModernIcon },
                        { id: 'staff', label: t('staff_role'), icon: WrenchScrewdriverIcon }
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: r.id, expertise: [], flatNumber: '' })}
                          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.role === r.id
                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                            }`}
                        >
                          <r.icon className="h-5 w-5" />
                          <span className="font-bold text-sm">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={handleNext} className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]">
                    {t('continue_security')}
                  </button>
                </div>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="form-label text-slate-700">{t('password')}</label>
                    <div className="relative group">
                      <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-[10px] uppercase font-black text-slate-500 mb-1">
                          <span>{t('password_security')}: {passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.color} transition-all duration-500`} style={{ width: passwordStrength.width }}></div>
                        </div>
                      </div>
                    )}
                    {errors.password && <p className="mt-1 text-xs text-rose-600 font-medium ml-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="form-label text-slate-700">{t('confirm_password')}</label>
                    <div className="relative group">
                      <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600 font-medium ml-1">{errors.confirmPassword}</p>}
                  </div>

                  {formData.role === 'resident' ? (
                    <div>
                      <label className="form-label text-slate-700">{t('flat_number')}</label>
                      <input name="flatNumber" type="text" value={formData.flatNumber} onChange={handleChange} placeholder="e.g. A-402" className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none" />
                      {errors.flatNumber && <p className="mt-1 text-xs text-rose-600 font-medium ml-1">{errors.flatNumber}</p>}
                    </div>
                  ) : (
                    <div>
                      <label className="form-label text-slate-700 mb-2">{t('expertise_areas')}</label>
                      <div className="flex flex-wrap gap-2">
                        {EXPERTISE_OPTIONS.map((exp) => (
                          <button
                            key={exp} type="button" onClick={() => toggleExpertise(exp)}
                            className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${formData.expertise.includes(exp)
                              ? 'border-sky-500 bg-sky-600 text-white shadow-md'
                              : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                              }`}
                          >
                            {exp}
                          </button>
                        ))}
                      </div>
                      {errors.expertise && <p className="mt-2 text-xs text-rose-600 font-medium ml-1">{errors.expertise}</p>}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">{t('back')}</button>
                    <button type="submit" disabled={loading} className="flex-[2] py-4 px-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 transform transition-all active:scale-[0.98]">{loading ? t('creating') : t('finalize')}</button>
                  </div>
                </div>
              )}
            </form>

            <p className="mt-8 text-center text-slate-600 text-sm">
              {t('already_member')} <Link to="/login" className="font-bold text-sky-600 hover:underline">{t('sign_in_link')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;