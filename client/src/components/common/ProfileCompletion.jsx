import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  PhoneIcon,
  HomeModernIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

const ProfileCompletion = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    role: 'resident',
    flatNumber: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone))
      newErrors.phone = 'Invalid 10-digit phone number';

    if (!formData.flatNumber.trim())
      newErrors.flatNumber = 'Flat number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile completed successfully! Welcome aboard.');
        
        // Force a brief delay and then a hard redirect to ensure the Auth context 
        // and page state are fully synchronized with the updated profile.
        setTimeout(() => {
          navigate(0); // Refresh current route
        }, 1500);
      }
    } catch (error) {
      toast.error('Failed to complete profile. Please try again.');
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
            className="absolute top-8 right-8 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
          >
            Logout
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form id="complete-profile-form" onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-mono"
                    placeholder="9123456780"
                  />
                </div>
                {errors.phone && <p className="mt-1.5 text-xs text-rose-600 font-bold ml-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Resident Specific Fields (Default) */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <HomeModernIcon className="h-5 w-5 text-sky-600" />
                    <label className="text-sm font-bold text-slate-800">Assigned Flat Number</label>
                  </div>
                  <input
                    name="flatNumber"
                    value={formData.flatNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all uppercase placeholder:italic"
                    placeholder="e.g. A-402, B-101"
                  />
                  <p className="mt-2 text-[10px] text-slate-500 italic ml-1">You belong to the Resident role by default.</p>
                  {errors.flatNumber && <p className="mt-1.5 text-xs text-rose-600 font-bold ml-1">{errors.flatNumber}</p>}
                </div>
            </div>
          </form>
        </div>

        <div className="p-8 pt-0 flex gap-4">
          <button
            type="submit"
            form="complete-profile-form"
            disabled={loading}
            className="flex-1 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Saving Details...' : 'Complete Account Setup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
