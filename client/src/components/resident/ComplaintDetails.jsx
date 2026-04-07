import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { complaintService } from '../../services/complaintService';
import RatingModal from './RatingModal';
import PaymentSection from './PaymentSection';
import Loader from '../common/Loader';
import { toast } from 'react-hot-toast';
import { format, parse } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const cardRef = useRef(null);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getComplaintById(id);
      // server response shape: { success, message, data: { complaint } }
      const payload = response?.data;
      const serverComplaint = payload?.data?.complaint || payload?.complaint || null;
      // defensive: if server returned a plain object with nested data, try common shapes
      setComplaint(serverComplaint || null);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      toast.error('Failed to load complaint details');
      // navigate back to list based on role
      const backPath = user?.role === 'admin' ? '/admin/complaints' : user?.role === 'staff' ? '/staff/complaints' : '/resident/complaints';
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (complaint && complaint.images) {
      console.log('Complaint images:', complaint.images);
    }
  }, [complaint]);

  const handleRatingSubmitted = () => {
    setShowRatingModal(false);
    fetchComplaintDetails();
    toast.success('Thank you for your feedback!');
  };

  if (loading) {
    return <Loader fullScreen text="Loading complaint details..." />;
  }

  if (!complaint) {
    return null;
  }



  // Normalize images arrays and accept either string URLs or objects returned by various APIs
  const normalizeImageArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        // Common object shapes: { url }, { secure_url }, { src }, { path }
        return item.url || item.secure_url || item.src || item.path || null;
      })
      .filter(Boolean);
  };

  const residentImages = normalizeImageArray(complaint.images);
  const proofImages = normalizeImageArray(complaint.proofImages);
  const displayedImages = residentImages;

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-amber-100 text-amber-800 border-amber-200',
      Assigned: 'bg-sky-100 text-sky-800 border-sky-200',
      'In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Payment Pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'Payment Received': 'bg-teal-100 text-teal-800 border-teal-200',
      'Payment Completed': 'bg-green-100 text-green-800 border-green-200',
      Closed: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    return colors[status] || colors.Pending;
  };

  const canRate =
    ['Payment Received', 'Payment Completed', 'Closed'].includes(complaint.status) &&
    !complaint.rating && user?.role === 'resident';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const loadingId = toast.loading('Generating PDF...');
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - 20; // 10mm margin both sides
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const top = 10;
      if (pdfHeight <= pageHeight - 20) {
        pdf.addImage(imgData, 'PNG', 10, top, pdfWidth, pdfHeight);
      } else {
        const ratio = (pageHeight - 20) / pdfHeight;
        pdf.addImage(imgData, 'PNG', 10, top, pdfWidth * ratio, pdfHeight * ratio);
      }
      pdf.save(`${complaint.complaintId || complaint._id}.pdf`);
      toast.remove(loadingId);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF generation error', err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => {
            const backPath = user?.role === 'admin' ? '/admin/complaints' : user?.role === 'staff' ? '/staff/complaints' : '/resident/complaints';
            navigate(backPath);
          }}
          className="mb-6 inline-flex items-center text-slate-500 hover:text-sky-600 font-bold transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Complaints
        </button>

        {/* Main Card */}
        <div ref={cardRef} className="dashboard-card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-8 py-8 text-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-black tracking-tight">
                    {complaint.complaintId}
                  </h1>
                  {complaint.isDelayed && (
                    <span className="inline-flex items-center px-3 py-1 bg-rose-500/20 backdrop-blur-md border border-rose-200/30 rounded-full text-xs font-bold text-rose-50">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                      Delayed
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-white/20 backdrop-blur-md border border-white/20">
                    {complaint.category}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-white/10 backdrop-blur-md border border-white/10`}
                  >
                    {complaint.priority} Priority
                  </span>
                  {complaint.preferredPayMode && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-md border ${complaint.preferredPayMode === 'Online'
                      ? 'bg-sky-400/30 border-sky-200/30 text-sky-50'
                      : 'bg-slate-400/30 border-slate-200/30 text-slate-50'
                      }`}>
                      {complaint.preferredPayMode === 'Online' ? '💳' : '💵'} {complaint.preferredPayMode}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wide border-2 bg-white ${complaint.status === 'Completed' || complaint.status === 'Payment Completed' ? 'text-emerald-600 border-emerald-500' :
                    complaint.status === 'In Progress' ? 'text-indigo-600 border-indigo-500' :
                      complaint.status === 'Assigned' ? 'text-sky-600 border-sky-500' :
                        complaint.status === 'Payment Pending' ? 'text-orange-600 border-orange-500' :
                          complaint.status === 'Payment Received' ? 'text-teal-600 border-teal-500' :
                            'text-amber-600 border-amber-500'
                    }`}
                >
                  {complaint.status}
                </span>

                {['Completed', 'Payment Received', 'Payment Completed', 'Closed'].includes(complaint.status) && (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-xs font-bold backdrop-blur-md"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                    Download Report
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-sky-500" />
                Description
              </h3>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <p className="text-slate-700 leading-relaxed font-medium">
                  {complaint.description}
                </p>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2 text-sky-500" />
                Attached Images
                <span className="ml-2 text-sm font-medium text-slate-400">({displayedImages.length})</span>
              </h3>

              {displayedImages.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                  <PhotoIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No images uploaded for this complaint.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {displayedImages.map((image, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm border border-slate-100"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`Attached Image ${i + 1}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/image-placeholder.png';
                        }}
                        className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-2xl">
                  <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Raised On
                  </div>
                  <p className="text-slate-900 font-bold text-lg">
                    {format(new Date(complaint.createdAt), 'PPpp')}
                  </p>
                </div>

                {complaint.assignedTo && (
                  <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Assigned To
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-black">
                        {complaint.assignedTo.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold text-lg leading-tight">
                          {complaint.assignedTo.name}
                        </p>
                        {complaint.assignedTo.expertise && (
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {complaint.assignedTo.expertise.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {complaint.deadline && (
                  <div className={`bg-white border p-5 rounded-2xl shadow-sm ${complaint.isDelayed ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                    <div className={`flex items-center text-xs font-bold uppercase tracking-wider mb-2 ${complaint.isDelayed ? 'text-rose-500' : 'text-slate-400'}`}>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Deadline
                    </div>
                    <p className={`text-lg font-bold ${complaint.isDelayed ? 'text-rose-700' : 'text-slate-900'}`}>
                      {format(new Date(complaint.deadline), 'PPpp')}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Preferred Visit Time */}
                {complaint.preferredVisit && complaint.preferredVisit.availability && (
                  <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Preferred Visit
                    </div>
                    <p className="text-slate-900 font-bold text-lg">
                      {complaint.preferredVisit.availability === 'Specific Time'
                        ? `Specific Time: ${(() => {
                          try {
                            const fromDate = parse(complaint.preferredVisit.from || '', 'HH:mm', new Date());
                            const toDate = parse(complaint.preferredVisit.to || '', 'HH:mm', new Date());
                            return `${format(fromDate, 'hh:mm a')} - ${format(toDate, 'hh:mm a')}`;
                          } catch (e) {
                            return `${complaint.preferredVisit.from} - ${complaint.preferredVisit.to}`;
                          }
                        })()
                        }`
                        : complaint.preferredVisit.availability}
                    </p>
                  </div>
                )}

                {complaint.completedAt && (
                  <div className="bg-emerald-50 border border-emerald-100 shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Completed On
                    </div>
                    <p className="text-emerald-900 font-bold text-lg">
                      {format(new Date(complaint.completedAt), 'PPpp')}
                    </p>
                  </div>
                )}

                {complaint.closedAt && (
                  <div className="bg-slate-100 border border-slate-200 shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Closed On
                    </div>
                    <p className="text-slate-800 font-bold text-lg">
                      {format(new Date(complaint.closedAt), 'PPpp')}
                    </p>
                  </div>
                )}

                {complaint.resolutionTime && (
                  <div className="bg-indigo-50 border border-indigo-100 shadow-sm p-5 rounded-2xl">
                    <div className="flex items-center text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Resolution Time
                    </div>
                    <p className="text-indigo-900 font-bold text-lg">
                      {complaint.resolutionTime} hours
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Work Remarks */}
            {complaint.workRemarks && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-sky-500" />
                  Work Remarks
                </h3>
                <div className="bg-sky-50 border border-sky-100 p-6 rounded-2xl">
                  <p className="text-sky-900 font-medium">{complaint.workRemarks}</p>
                </div>
              </div>
            )}

            {/* Proof Images */}
            {complaint.proofImages && complaint.proofImages.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-emerald-500" />
                  Work Completion Proof
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {complaint.proofImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm border border-emerald-100"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`Proof ${index + 1}`}
                        className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            {complaint.statusHistory && complaint.statusHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Status Timeline
                </h3>
                <div className="space-y-0 relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200"></div>
                  {complaint.statusHistory
                    .slice()
                    .reverse()
                    .map((history, index) => (
                      <div key={index} className="flex relative items-start mb-6 last:mb-0 group">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-sky-500 flex items-center justify-center z-10 shadow-sm mt-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                        <div className="ml-6 flex-1 bg-white border border-slate-100 p-4 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide border ${getStatusColor(
                                history.status
                              )}`}
                            >
                              {history.status}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {format(new Date(history.changedAt), 'PPp')}
                            </span>
                          </div>
                          {history.remarks && (
                            <p className="text-sm text-slate-700 font-medium">
                              {history.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Payment Section — for resident only */}
            {user?.role === 'resident' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  💳 Payment
                </h3>
                <PaymentSection
                  complaint={complaint}
                  onPaymentSuccess={fetchComplaintDetails}
                />
              </div>
            )}

            {/* Rating Section */}
            {complaint.rating ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-8 rounded-3xl">
                <h3 className="text-xl font-black text-amber-900 mb-4 flex items-center">
                  <StarIcon className="h-6 w-6 mr-2 text-amber-500" />
                  Your Rating
                </h3>
                <div className="flex items-center mb-4">
                  <div className="flex mr-4 bg-white px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StarIconSolid
                        key={index}
                        className={`h-6 w-6 ${index < complaint.rating.rating
                          ? 'text-amber-400'
                          : 'text-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-amber-800">
                    {complaint.rating.rating} / 5
                  </span>
                </div>
                {complaint.rating.feedback && (
                  <div className="bg-white/80 p-5 rounded-2xl border border-amber-200/50 backdrop-blur-sm">
                    <p className="text-slate-700 font-medium italic">
                      "{complaint.rating.feedback}"
                    </p>
                  </div>
                )}
                <p className="text-xs font-bold text-amber-700/60 uppercase tracking-widest mt-4">
                  Rated on {format(new Date(complaint.rating.createdAt), 'PPp')}
                </p>
              </div>
            ) : canRate ? (
              <div className="bg-sky-50 border border-sky-100 p-8 rounded-3xl text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <StarIcon className="h-8 w-8 text-sky-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  Rate This Service
                </h3>
                <p className="text-slate-500 font-medium mb-6 max-w-md mx-auto">
                  How satisfied are you with the work done? Your feedback helps us improve our maintenance quality.
                </p>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all font-bold shadow-lg shadow-sky-500/30 transform hover:scale-105"
                >
                  <StarIcon className="h-5 w-5 mr-2" />
                  Rate Now
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          complaintId={complaint._id}
          staffName={complaint.assignedTo?.name}
          onClose={() => setShowRatingModal(false)}
          onSuccess={handleRatingSubmitted}
        />
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-10 w-10" />
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ComplaintDetails;