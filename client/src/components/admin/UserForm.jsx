import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { STAFF_EXPERTISE } from '../../utils/constants';
import { toast } from 'react-hot-toast';

const ROLES = ['resident', 'staff', 'admin'];
// Use server-aligned staff expertise options
const EXPERTISE_OPTIONS = STAFF_EXPERTISE;

const UserForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'resident',
    flatNumber: '',
    phone: '',
    expertise: [],
    isActive: true,
  });

  useEffect(() => {
    if (isEdit) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await userService.getUserById(id);
      // Server returns { success, message, data: { user, stats } }
      const u = res?.data?.data?.user ?? res?.data?.user ?? res?.data ?? null;
      setForm({
        name: u.name || '',
        email: u.email || '',
        password: '',
        role: u.role || 'resident',
        flatNumber: u.flatNumber || '',
        phone: u.phone || '',
        expertise: u.expertise || [],
        isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
      });
    } catch (err) {
      toast.error('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // If role changes, reset role-specific fields
    if (name === 'role') {
      setForm((prev) => ({ ...prev, [name]: value, expertise: [], flatNumber: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleExpertise = (exp) => {
    setForm((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(exp) ? prev.expertise.filter((e) => e !== exp) : [...prev.expertise, exp],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        flatNumber: form.flatNumber || undefined,
        phone: form.phone || undefined,
        expertise: form.role === 'staff' && form.expertise && form.expertise.length > 0 ? form.expertise : undefined,
        isActive: form.isActive,
      };

      if (!isEdit) {
        // require password for new user
        if (!form.password) {
          toast.error('Password is required for new user');
          setLoading(false);
          return;
        }
        payload.password = form.password;
        await userService.createUser(payload);
        toast.success('User created successfully');
      } else {
        // update
        // include password only if provided
        if (form.password) payload.password = form.password;
        await userService.updateUser(id, payload);
        toast.success('User updated successfully');
      }

      navigate('/admin/users');
    } catch (err) {
      const resp = err.response?.data;
      if (resp && resp.errors && Array.isArray(resp.errors)) {
        // Show first validation message and log all
        toast.error(resp.errors[0].message || 'Validation failed');
        console.error('Validation errors:', resp.errors);
      } else {
        toast.error(resp?.message || 'Failed to save user');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit User' : 'Add User'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input name="password" value={form.password} onChange={handleChange} type="password" required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          )}

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep)</label>
              <input name="password" value={form.password} onChange={handleChange} type="password" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2">
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
          </div>

          {form.role === 'resident' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Flat Number</label>
              <input name="flatNumber" value={form.flatNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
            </div>
          )}

          {form.role === 'staff' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Areas</label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => toggleExpertise(exp)}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${form.expertise.includes(exp)
                        ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                      }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="md:col-span-2 flex items-center space-x-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button type="button" onClick={() => navigate('/admin/users')} className="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
