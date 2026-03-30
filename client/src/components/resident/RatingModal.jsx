import { useState } from 'react';
import { complaintService } from '../../services/complaintService';
import { toast } from 'react-hot-toast';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const RatingModal = ({ complaintId, staffName, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      await complaintService.rateComplaint(complaintId, {
        rating,
        feedback: feedback.trim(),
      });

      toast.success('Rating submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(
        error.response?.data?.message || 'Failed to submit rating'
      );
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Below Average',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Rate Service
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          {staffName && (
            <div className="text-center mb-8 bg-sky-50 p-4 rounded-xl border border-sky-100">
              <p className="text-sm font-medium text-sky-800">
                How was your experience with <br />
                <span className="font-black text-lg text-sky-900">{staffName}</span>?
              </p>
            </div>
          )}

          {/* Star Rating */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                const isActive = starValue <= (hoveredRating || rating);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transform transition-transform hover:scale-110 active:scale-90"
                  >
                    {isActive ? (
                      <StarIconSolid className={`h-10 w-10 ${starValue <= 2 ? 'text-rose-400 drop-shadow-sm' :
                          starValue <= 3 ? 'text-amber-400 drop-shadow-sm' :
                            'text-emerald-400 drop-shadow-sm'
                        }`} />
                    ) : (
                      <StarIcon className="h-10 w-10 text-slate-200" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Rating Label */}
            <div className={`h-8 transition-opacity ${(hoveredRating || rating) > 0 ? 'opacity-100' : 'opacity-0'
              }`}>
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${(hoveredRating || rating) <= 2 ? 'bg-rose-100 text-rose-700' :
                  (hoveredRating || rating) <= 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                }`}>
                {ratingLabels[hoveredRating || rating]}
              </span>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="mb-8">
            <label
              htmlFor="feedback"
              className="block text-sm font-bold text-slate-700 mb-2"
            >
              Additional Feedback <span className="text-slate-400 font-medium ml-1">(Optional)</span>
            </label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience or suggestions to help us improve..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none font-medium transition-all"
              maxLength={500}
            />
            <p className="mt-1 text-xs font-bold text-slate-400 text-right">
              {feedback.length}/500
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-6 py-3.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Submitting...
                </span>
              ) : (
                'Submit Rating'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;