import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { complaintService } from '../../services/complaintService';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  PhotoIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';
import { parse, format } from 'date-fns';

const CATEGORIES = COMPLAINT_CATEGORIES;

const PRIORITIES = ['Low', 'Medium', 'High'];

const ComplaintForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    priority: 'Medium',
    preferredPayMode: 'Offline',
  });

  // Preferred visit time state (store as 12-hour components, convert to 24h on submit)
  const [preferredVisit, setPreferredVisit] = useState({
    availability: 'Anytime',
    fromHour: '',
    fromMinute: '',
    fromPeriod: 'AM',
    toHour: '',
    toMinute: '',
    toPeriod: 'AM',
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePreferredChange = (e) => {
    const { name, value } = e.target;
    setPreferredVisit((prev) => ({ ...prev, [name]: value }));
    if (errors.preferredVisit) {
      setErrors((prev) => ({ ...prev, preferredVisit: '' }));
    }
  };

  // Helper to convert 12-hour components to 24-hour HH:MM string
  const to24 = ({ hour, minute, period }) => {
    if (!hour || !minute || !period) return '';
    let h = parseInt(hour, 10);
    const m = minute.padStart(2, '0');
    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate number of images
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Validate file size and type
    const validFiles = [];
    const validPreviews = [];

    files.forEach((file) => {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        validPreviews.push(reader.result);
        if (validPreviews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...validPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages((prev) => [...prev, ...validFiles]);
  };

  // Remove image
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    // Only validate preferred visit time for Offline pay mode
    if (formData.preferredPayMode === 'Offline') {
      if (!preferredVisit.availability) {
        newErrors.preferredVisit = 'Preferred visit time is required';
      } else if (preferredVisit.availability === 'Specific Time') {
        const from24 = to24({ hour: preferredVisit.fromHour, minute: preferredVisit.fromMinute, period: preferredVisit.fromPeriod });
        const to24str = to24({ hour: preferredVisit.toHour, minute: preferredVisit.toMinute, period: preferredVisit.toPeriod });
        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (!from24 || !timeRegex.test(from24)) {
          newErrors.preferredVisit = 'Please provide a valid start time';
        } else if (!to24str || !timeRegex.test(to24str)) {
          newErrors.preferredVisit = 'Please provide a valid end time';
        } else if (from24 >= to24str) {
          newErrors.preferredVisit = 'Start time must be earlier than end time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const complaintFormData = new FormData();
      complaintFormData.append('category', formData.category);
      complaintFormData.append('description', formData.description.trim());
      complaintFormData.append('priority', formData.priority);
      complaintFormData.append('preferredPayMode', formData.preferredPayMode);

      // Append preferred visit fields only for Offline pay mode
      if (formData.preferredPayMode === 'Offline') {
        complaintFormData.append('preferredVisitAvailability', preferredVisit.availability);
        if (preferredVisit.availability === 'Specific Time') {
          const from24 = to24({ hour: preferredVisit.fromHour, minute: preferredVisit.fromMinute, period: preferredVisit.fromPeriod });
          const to24str = to24({ hour: preferredVisit.toHour, minute: preferredVisit.toMinute, period: preferredVisit.toPeriod });
          complaintFormData.append('preferredVisitFrom', from24);
          complaintFormData.append('preferredVisitTo', to24str);
        }
      } else {
        // For online payment, no visit needed - set a default
        complaintFormData.append('preferredVisitAvailability', 'Anytime');
      }

      // Append images
      images.forEach((image) => {
        complaintFormData.append('images', image);
      });

      const response = await complaintService.createComplaint(complaintFormData);

      toast.success('Complaint raised successfully!');
      navigate('/resident/complaints');
    } catch (error) {
      const resp = error.response?.data;
      console.error('Error creating complaint response:', resp ?? error);

      if (resp) {
        // If server returned validation errors array
        if (resp.errors && Array.isArray(resp.errors) && resp.errors.length > 0) {
          resp.errors.forEach((err) => {
            const field = err.field ?? err.param ?? err.path ?? 'Field';
            const message = err.message ?? err.msg ?? JSON.stringify(err);
            toast.error(`${field}: ${message}`);
          });
        } else if (resp.message) {
          toast.error(resp.message);
        } else {
          toast.error('Failed to create complaint');
        }
      } else {
        toast.error('Failed to create complaint');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="dashboard-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 py-6">
          <h2 className="text-2xl font-black text-white">
            Raise New Complaint
          </h2>
          <p className="mt-1 text-sky-100 font-medium">
            Please provide details about the issue you are facing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-8">
            {/* User Info (Read-only) */}
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Name
                </label>
                <p className="text-slate-900 font-bold text-lg">{user?.name}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Flat Number
                </label>
                <div className="inline-flex items-center px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <p className="text-slate-900 font-bold">{user?.flatNumber}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-bold text-slate-700 mb-2"
                >
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium ${errors.category ? 'border-rose-300 ring-rose-200' : 'border-slate-200 focus:border-sky-500'
                    }`}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center font-bold">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Priority
                </label>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {PRIORITIES.map((priority) => (
                    <label key={priority} className="flex-1 text-center cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${formData.priority === priority
                        ? 'bg-white shadow-sm text-sky-600 ring-1 ring-black/5'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}>
                        {priority}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-bold text-slate-700 mb-2"
              >
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Please describe the issue in detail (e.g., location, type of noise, severity)..."
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-medium resize-none ${errors.description ? 'border-rose-300 ring-rose-200' : 'border-slate-200 focus:border-sky-500'
                  }`}
              />
              <div className="mt-2 flex justify-between items-start">
                <div>
                  {errors.description && (
                    <p className="text-sm text-rose-600 flex items-center font-bold">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                      {errors.description}
                    </p>
                  )}
                </div>
                <p className={`text-xs font-bold ${formData.description.length > 450 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Preferred Pay Mode */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 p-6 rounded-2xl">
              <label className="block text-sm font-bold text-slate-700 mb-4">
                Preferred Pay Mode <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['Offline', 'Online'].map((mode) => (
                  <label key={mode} className="cursor-pointer">
                    <input
                      type="radio"
                      name="preferredPayMode"
                      value={mode}
                      checked={formData.preferredPayMode === mode}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      formData.preferredPayMode === mode
                        ? mode === 'Online'
                          ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100'
                          : 'border-slate-400 bg-white shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.preferredPayMode === mode
                          ? mode === 'Online' ? 'border-sky-500 bg-sky-500' : 'border-slate-500 bg-slate-500'
                          : 'border-slate-300'
                      }`}>
                        {formData.preferredPayMode === mode && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${formData.preferredPayMode === mode ? 'text-slate-900' : 'text-slate-600'}`}>
                          {mode === 'Online' ? '💳 Online' : '💵 Offline'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {mode === 'Online' ? 'Pay via Razorpay' : 'Cash on visit'}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Online payment notice */}
              {formData.preferredPayMode === 'Online' && (
                <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
                  <span className="text-sky-500 text-lg mt-0.5">ℹ️</span>
                  <div>
                    <p className="text-sm font-bold text-sky-800">Online Payment Selected</p>
                    <p className="text-xs text-sky-600 mt-1">
                      After work completion, you'll receive a payment link. Pay securely via Razorpay (UPI, Card, Net Banking).
                      No staff visit required for payment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Preferred Visit Time — only for Offline pay mode */}
            {formData.preferredPayMode === 'Offline' && (
            <div className={`bg-slate-50 border p-6 rounded-2xl ${errors.preferredVisit ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'}`}>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Preferred Visit Time <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-4">
                <select
                  name="availability"
                  value={preferredVisit.availability}
                  onChange={(e) => handlePreferredChange({ target: { name: 'availability', value: e.target.value } })}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all font-medium"
                >
                  <option value="Anytime">Anytime</option>
                  <option value="Lunch Time">Lunch Time</option>
                  <option value="Break Time">Break Time</option>
                  <option value="Specific Time">Specific Time</option>
                </select>


                {preferredVisit.availability === 'Specific Time' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">From</label>
                      <div className="flex gap-2">
                        <select
                          name="fromHour"
                          value={preferredVisit.fromHour}
                          onChange={handlePreferredChange}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none"
                        >
                          <option value="">HH</option>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={String(i + 1)}>{String(i + 1).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          name="fromMinute"
                          value={preferredVisit.fromMinute}
                          onChange={handlePreferredChange}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none"
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 60 }).map((_, i) => (
                            <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          name="fromPeriod"
                          value={preferredVisit.fromPeriod}
                          onChange={handlePreferredChange}
                          className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">To</label>
                      <div className="flex gap-2">
                        <select
                          name="toHour"
                          value={preferredVisit.toHour}
                          onChange={handlePreferredChange}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none"
                        >
                          <option value="">HH</option>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={String(i + 1)}>{String(i + 1).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          name="toMinute"
                          value={preferredVisit.toMinute}
                          onChange={handlePreferredChange}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none"
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 60 }).map((_, i) => (
                            <option key={i} value={String(i).padStart(2, '0')}>{String(i).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          name="toPeriod"
                          value={preferredVisit.toPeriod}
                          onChange={handlePreferredChange}
                          className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-sky-500 outline-none"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview times in 12-hour format for user clarity */}
                {preferredVisit.availability === 'Specific Time' && (
                  (preferredVisit.fromHour || preferredVisit.fromMinute || preferredVisit.toHour || preferredVisit.toMinute)) && (
                    <div className="text-sm font-bold text-sky-600 bg-sky-50 p-3 rounded-lg inline-block border border-sky-100">
                      {(() => {
                        try {
                          const from24 = to24({ hour: preferredVisit.fromHour, minute: preferredVisit.fromMinute, period: preferredVisit.fromPeriod });
                          const to24str = to24({ hour: preferredVisit.toHour, minute: preferredVisit.toMinute, period: preferredVisit.toPeriod });
                          const fromDate = from24 ? parse(from24, 'HH:mm', new Date()) : null;
                          const toDate = to24str ? parse(to24str, 'HH:mm', new Date()) : null;
                          const fromStr = fromDate ? format(fromDate, 'hh:mm a') : '--';
                          const toStr = toDate ? format(toDate, 'hh:mm a') : '--';
                          return `Selected Window: ${fromStr} — ${toStr}`;
                        } catch (e) {
                          return `Selected Window: -- — --`;
                        }
                      })()}
                    </div>
                  )}

                {errors.preferredVisit && (
                  <p className="mt-1 text-sm text-rose-600 flex items-center font-bold">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                    {errors.preferredVisit}
                  </p>
                )}
              </div>
            </div>
            )} {/* End Offline pay mode visit time section */}

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Upload Images <span className="text-slate-400 font-medium ml-1">(Optional, Max 5)</span>
              </label>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-white/20 text-white rounded-full p-2 backdrop-blur-md hover:bg-white/40 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-3 bg-slate-50 rounded-full mb-3 group-hover:bg-white text-slate-400 group-hover:text-sky-500 transition-colors shadow-sm">
                      <ArrowUpTrayIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 group-hover:text-sky-700 transition-colors">
                      Click to upload images
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-sky-500/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting Complaint...
                </span>
              ) : (
                'Submit Complaint'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/resident/complaints')}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;