import { useState } from 'react';
import { complaintService, paymentService } from '../../services/complaintService';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  PhotoIcon,
  ExclamationCircleIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const UpdateStatusModal = ({ complaint, onClose, onSuccess }) => {
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  // Available status transitions based on current status and pay mode
  const getAvailableStatuses = () => {
    const payMode = complaint.preferredPayMode || 'Offline';
    const statusMap = {
      Assigned: ['In Progress'],
      'In Progress': ['Completed'],
      // After completion — staff can move to payment pending (offline) or back to in-progress
      Completed: payMode === 'Offline'
        ? ['In Progress']
        : ['In Progress'],
      // If payment pending (offline), staff confirms payment received
      'Payment Pending': payMode === 'Offline' ? [] : [],
    };
    return statusMap[complaint.status] || [];
  };

  const availableStatuses = getAvailableStatuses();

  // Handle image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate number of images
    if (proofImages.length + files.length > 3) {
      toast.error('Maximum 3 proof images allowed');
      return;
    }

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

    setProofImages((prev) => [...prev, ...validFiles]);
  };

  // Remove image
  const removeImage = (index) => {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!status) {
      newErrors.status = 'Please select a status';
    }

    if (status === 'Completed' && proofImages.length === 0) {
      newErrors.proofImages = 'Please upload at least one proof image for completion';
    }

    if (status === 'Completed' && !amount) {
      newErrors.amount = 'Please enter the service amount (₹)';
    }

    if (remarks.trim().length > 1000) {
      newErrors.remarks = 'Remarks cannot exceed 1000 characters';
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
      const formData = new FormData();
      formData.append('status', status);
      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }
      if (status === 'Completed' && amount) {
        formData.append('amount', amount);
      }

      // Append proof images
      proofImages.forEach((image) => {
        formData.append('proofImages', image);
      });

      await complaintService.updateStatus(complaint._id, formData);

      onSuccess();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Update Status
            </h3>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {complaint.complaintId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          <div className="space-y-6">
            {/* Current Info */}
            <div className="bg-sky-50 border border-sky-100 p-5 rounded-2xl">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Current Status</span>
                  <span className="font-black text-slate-800 text-lg">
                    {complaint.status}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Category</span>
                  <span className="font-bold text-slate-700">
                    {complaint.category}
                  </span>
                </div>
              </div>
            </div>

            {/* New Status and Remarks — Only if NOT waiting for payment and NOT already completed */}
            {complaint.status !== 'Payment Pending' && complaint.status !== 'Completed' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    New Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      if (errors.status) {
                        setErrors((prev) => ({ ...prev, status: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 bg-white font-medium transition-all ${errors.status ? 'border-rose-300 ring-rose-200' : 'border-slate-200 focus:border-sky-500'
                      }`}
                  >
                    <option value="">Select Status</option>
                    {availableStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-2 text-sm text-rose-600 flex items-center font-bold">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                      {errors.status}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Work Remarks {status === 'Completed' && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => {
                      setRemarks(e.target.value);
                      if (errors.remarks) {
                        setErrors((prev) => ({ ...prev, remarks: '' }));
                      }
                    }}
                    placeholder="Describe the work done, parts used, or any observations..."
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none font-medium transition-all ${errors.remarks ? 'border-rose-300 ring-rose-200' : 'border-slate-200 focus:border-sky-500'
                      }`}
                    maxLength={1000}
                  />
                  <div className="mt-2 flex justify-between items-start">
                    <div>
                      {errors.remarks && (
                        <p className="text-sm text-rose-600 flex items-center font-bold">
                          <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                          {errors.remarks}
                        </p>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-400">{remarks.length}/1000</p>
                  </div>
                </div>

                {/* Amount Input (only for Completion) */}
                {status === 'Completed' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Service Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">₹</span>
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                        }}
                        placeholder="0.00"
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-black text-lg transition-all ${errors.amount ? 'border-rose-300 ring-rose-200 bg-rose-50' : 'border-slate-200 focus:border-sky-500 bg-white'
                          }`}
                        min="0"
                      />
                    </div>
                    {errors.amount && (
                      <p className="mt-2 text-sm text-rose-600 flex items-center font-bold">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                        {errors.amount}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400 font-medium italic">
                      This is the amount the resident will see and pay.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Proof Images (for Completed status) */}
            {status === 'Completed' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Upload Proof Images <span className="text-rose-500">*</span>
                  <span className="text-xs font-medium text-slate-400 ml-2">(Max 3)</span>
                </label>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-video rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm text-white hover:bg-white/40">
                            <XMarkIcon className="h-5 w-5" />
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {proofImages.length < 3 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:border-sky-500 hover:bg-sky-50/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-2 bg-slate-50 rounded-full mb-2 group-hover:bg-white text-slate-400 group-hover:text-sky-500 transition-colors shadow-sm">
                        <PhotoIcon className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 group-hover:text-sky-700 transition-colors">
                        Click to upload
                      </p>
                      <p className="text-xs font-medium text-slate-400 mt-1">
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

                {errors.proofImages && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center font-bold">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
                    {errors.proofImages}
                  </p>
                )}
              </div>
            )}

            {/* Info Message */}
            {status === 'Completed' && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="mt-0.5 min-w-[1.25rem]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">✓</span>
                </div>
                <p className="text-sm font-medium text-emerald-800 leading-relaxed">
                  Marking this task as <span className="font-bold">Completed</span> will notify the resident immediately. They will be invited to rate your service quality.
                </p>
              </div>
            )}
            {/* Payment Action — Request Offline Payment (after work completed) */}
            {complaint.status === 'Completed' && complaint.preferredPayMode === 'Offline' && (
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 mb-3">
                  <CurrencyRupeeIcon className="h-5 w-5 text-amber-600" />
                  <span className="font-bold text-amber-900">Offline Payment Required</span>
                </div>
                <p className="text-sm text-amber-700 mb-4">
                  This complaint requires offline cash payment. Click below to notify the resident and visit them to collect payment.
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await paymentService.requestOfflinePayment(complaint._id);
                      toast.success('Offline payment request sent to resident');
                      onSuccess();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to request payment');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CurrencyRupeeIcon className="h-5 w-5" />
                  Request Offline Payment
                </button>
              </div>
            )}

            {/* Payment Action — Online Payment Status */}
            {complaint.status === 'Completed' && complaint.preferredPayMode === 'Online' && (
              <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl animate-in fade-in slide-in-from-top-1 text-center">
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl">💳</span>
                </div>
                <p className="font-bold text-sky-900">Online Payment Pending</p>
                <p className="text-sm text-sky-600 mt-2">
                  The resident has been notified to pay online. The system will automatically update the status once the payment is verified.
                </p>
              </div>
            )}

            {/* Payment Action — Confirm Offline Payment Received */}
            {complaint.status === 'Payment Pending' && complaint.preferredPayMode === 'Offline' && (
              <div className="bg-teal-50 border border-teal-200 p-5 rounded-2xl animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="h-5 w-5 text-teal-600" />
                  <span className="font-bold text-teal-900">Confirm Payment Collection</span>
                </div>
                <p className="text-sm text-teal-700 mb-4">
                  Confirm that you have physically collected the cash payment from the resident.
                </p>
                <input
                  type="number"
                  placeholder="Amount collected (₹) — optional"
                  className="w-full px-4 py-2 border border-teal-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm font-medium mb-3"
                  id="offline-amount-input"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const amountInput = document.getElementById('offline-amount-input');
                      const amount = amountInput?.value ? parseInt(amountInput.value) * 100 : null;
                      await paymentService.confirmOfflinePayment(complaint._id, {
                        amount,
                        remarks: 'Cash payment collected by staff',
                      });
                      toast.success('✅ Offline payment confirmed successfully!');
                      onSuccess();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to confirm payment');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md shadow-teal-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Confirm Payment Received
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            {complaint.status !== 'Payment Pending' && complaint.status !== 'Completed' && (
              <button
                type="submit"
                disabled={loading || !status}
                className="flex-1 bg-sky-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                    Updating Status...
                  </span>
                ) : (
                  'Update Status'
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-white border-2 border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStatusModal;