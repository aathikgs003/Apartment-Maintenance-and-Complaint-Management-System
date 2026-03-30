import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
      });
      setImagePreview(user.profileImage || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (form.phone && form.phone.trim() !== '') formData.append('phone', form.phone.trim());
      if (imageFile) formData.append('profileImage', imageFile);

      const result = await updateProfile(formData);
      if (result && result.success === false) {
        // Auth context already shows toast on failure
        setSubmitting(false);
        return;
      }

      toast.success('Profile updated');
      navigate('/profile');
    } catch (err) {
      console.error('Update profile error', err);
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
          <p className="mt-2 text-slate-500 text-lg">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="dashboard-card p-8 bg-white shadow-xl shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* Image Upload Section */}
            <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Profile Photo</label>
              <div className="relative group cursor-pointer">
                <div className="h-40 w-40 rounded-full border-4 border-slate-100 shadow-xl overflow-hidden bg-slate-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-slate-300">
                      <svg className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Change Photo</span>
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Change profile photo"
                />
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">
                Click the image to upload. JPG, GIF or PNG. Max size of 2MB.
              </p>
            </div>

            {/* Form Fields Section */}
            <div className="w-full md:w-2/3 space-y-6">

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Read-only fields could go here (Email, Role) */}
              <div className="pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                    <div className="text-slate-600 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Role</label>
                    <div className="text-slate-600 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 capitalize">
                      {user?.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-3 rounded-xl bg-white text-slate-600 border border-slate-200 font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Changes...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
