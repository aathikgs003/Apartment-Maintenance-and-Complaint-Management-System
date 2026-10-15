import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  PhoneIcon,
  HomeModernIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { STAFF_EXPERTISE } from '../../utils/constants';

const ProfileCompletion = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    role: user?.role === 'staff' ? 'staff' : 'resident',
    flatNumber: user?.flatNumber === 'G-PENDING' ? '' : user?.flatNumber || '',
    expertise: Array.isArray(user?.expertise) && user.expertise.length > 0 ? user.expertise : [],
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
    }));
    setErrors((prev) => ({ ...prev, flatNumber: '', expertise: '' }));
  };

  const toggleExpertise = (exp) => {
    setFormData((prev) => {
      const exists = prev.expertise.includes(exp);
      const updated = exists
        ? prev.expertise.filter((item) => item !== exp)
        : [...prev.expertise, exp];
      return { ...prev, expertise: updated };
    });
    if (errors.expertise) setErrors((prev) => ({ ...prev, expertise: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(cleanPhone))
      newErrors.phone = 'Invalid 10-digit Indian phone number';

    if (formData.role === 'resident') {
      if (!formData.flatNumber.trim()) {
        newErrors.flatNumber = 'Flat number is required';
      }
    } else if (formData.role === 'staff') {
      if (!formData.expertise || formData.expertise.length === 0) {
        newErrors.expertise = 'Please select at least one area of expertise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
      };

      if (formData.role === 'resident') {
        payload.flatNumber = formData.flatNumber.trim().toUpperCase();
      } else if (formData.role === 'staff') {
        payload.expertise = formData.expertise;
      }

      const result = await updateProfile(payload);
      if (result && result.success) {
        toast.success('Profile completed successfully! Welcome aboard.');
        const targetRole = result.user?.role || payload.role || 'resident';
        navigate(`/${targetRole}/dashboard`, { replace: true });
      } else {
        toast.error(result?.message || 'Failed to complete profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500"></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-8 text-white relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <CheckBadgeIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Complete Your Profile</h2>
              <p className="text-sky-100/80 text-sm font-medium">Just a few more details to get started</p>
            </div>
          </div>

          <button
            onClick={logout}
            type="button"
            className="absolute top-8 right-8 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-all cursor-pointer"
          >
            Logout
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form id="complete-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('resident')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    formData.role === 'resident'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <HomeModernIcon className="h-5 w-5" />
                  <span>Resident</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('staff')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    formData.role === 'staff'
                      ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <WrenchScrewdriverIcon className="h-5 w-5" />
                  <span>Maintenance Staff</span>
                </button>
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Display Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                    placeholder="Enter your name"
                  />
                </div>
                {errors.name && <p className="mt-1.5 text-xs text-rose-600 font-bold ml-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Phone Number</label>
                <div className="relative group">
                  <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono font-medium"
                    placeholder="9123456780"
                  />
                </div>
                {errors.phone && <p className="mt-1.5 text-xs text-rose-600 font-bold ml-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Resident: Flat Number */}
            {formData.role === 'resident' && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <HomeModernIcon className="h-5 w-5 text-sky-600" />
                  <label className="text-sm font-bold text-slate-800">Assigned Flat Number</label>
                </div>
                <input
                  name="flatNumber"
                  value={formData.flatNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all uppercase placeholder:italic font-medium"
                  placeholder="e.g. A-402, B-101"
                />
                <p className="mt-2 text-[11px] text-slate-500 italic ml-1">
                  Specify your building block and flat number (e.g., A-101 or Flat 402).
                </p>
                {errors.flatNumber && (
                  <p className="mt-1.5 text-xs text-rose-600 font-bold ml-1">{errors.flatNumber}</p>
                )}
              </div>
            )}

            {/* Staff: Expertise Areas */}
            {formData.role === 'staff' && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <WrenchScrewdriverIcon className="h-5 w-5 text-sky-600" />
                  <label className="text-sm font-bold text-slate-800">Expertise Areas</label>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Select the types of maintenance complaints you handle:
                </p>
                <div className="flex flex-wrap gap-2">
                  {STAFF_EXPERTISE.map((exp) => {
                    const isSelected = formData.expertise.includes(exp);
                    return (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => toggleExpertise(exp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {exp}
                      </button>
                    );
                  })}
                </div>
                {errors.expertise && (
                  <p className="mt-2 text-xs text-rose-600 font-bold ml-1">{errors.expertise}</p>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="p-8 pt-0 flex gap-4">
          <button
            type="submit"
            form="complete-profile-form"
            disabled={loading}
            className="flex-1 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Saving Details...' : 'Complete Account Setup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
