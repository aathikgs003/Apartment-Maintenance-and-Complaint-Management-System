import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { paymentService } from '../../services/complaintService';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

// Amount in paise (₹500 = 50000 paise) — update as per your pricing
const DEFAULT_AMOUNT_PAISE = 50000;
const DEFAULT_AMOUNT_DISPLAY = '₹500.00';

const PaymentSection = ({ complaint, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  const status = complaint?.status;
  const payMode = complaint?.preferredPayMode;

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOnlinePayment = async () => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Step 1: Create order on backend
      const orderRes = await paymentService.createOrder(complaint._id, DEFAULT_AMOUNT_PAISE);
      const { orderId, amount, currency, keyId, complaintNumber } = orderRes.data.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Apartment Maintenance System',
        description: `Payment for Complaint #${complaintNumber}`,
        order_id: orderId,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await paymentService.verifyPayment(complaint._id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success('🎉 Payment successful! Thank you.');
              onPaymentSuccess?.();
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: complaint.residentId?.name || '',
          email: complaint.residentId?.email || '',
        },
        notes: {
          complaintId: complaint._id,
          complaintNumber: complaint.complaintId,
        },
        theme: {
          color: '#0ea5e9',
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled', { icon: '⚠️' });
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  // ---- RENDER CONDITIONS ----

  // Online payment done
  if (payMode === 'Online' && status === 'Payment Completed') {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-black text-emerald-900 text-lg">Payment Completed ✅</p>
            <p className="text-sm text-emerald-600 font-medium">Online payment successfully processed</p>
          </div>
        </div>
        {complaint.payment?.razorpayPaymentId && (
          <div className="mt-4 bg-white/80 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">
              <ShieldCheckIcon className="h-4 w-4" />
              Payment ID
            </div>
            <p className="text-sm font-mono text-slate-700">{complaint.payment.razorpayPaymentId}</p>
            {complaint.payment.amount && (
              <p className="text-sm text-emerald-800 font-bold mt-2">
                Amount: ₹{(complaint.payment.amount / 100).toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Online payment pending — show Pay Now button
  if (payMode === 'Online' && (status === 'Completed' || status === 'Payment Pending')) {
    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
            <CreditCardIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-black text-sky-900 text-lg">Payment Required</p>
            <p className="text-sm text-sky-600 font-medium">Work completed — please complete payment to proceed</p>
          </div>
        </div>

        <div className="bg-white/80 rounded-xl p-4 border border-sky-100 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-700 font-bold">
              <CurrencyRupeeIcon className="h-5 w-5" />
              <span>Amount Due</span>
            </div>
            <span className="text-2xl font-black text-sky-900">{DEFAULT_AMOUNT_DISPLAY}</span>
          </div>
          <p className="text-xs text-sky-500 font-medium mt-2">
            Secure payment via Razorpay — UPI, Card, Net Banking supported
          </p>
        </div>

        <button
          id="btn-pay-now"
          onClick={handleOnlinePayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-4 px-6 rounded-xl font-black text-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CreditCardIcon className="h-6 w-6" />
              Proceed to Pay — {DEFAULT_AMOUNT_DISPLAY}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400 font-medium">
          <ShieldCheckIcon className="h-4 w-4" />
          <span>256-bit SSL encrypted · Powered by Razorpay</span>
        </div>
      </div>
    );
  }

  // Offline payment — waiting for payment collection
  if (payMode === 'Offline' && status === 'Payment Pending') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-black text-amber-900 text-lg">Awaiting Payment Collection</p>
            <p className="text-sm text-amber-600 font-medium">Staff will visit to collect payment in cash</p>
          </div>
        </div>
        <div className="mt-3 bg-white/70 rounded-xl p-4 border border-amber-100">
          <p className="text-sm text-amber-800 font-semibold">
            💡 Please keep payment ready. Staff will update the status after collecting.
          </p>
        </div>
      </div>
    );
  }

  // Offline payment received
  if (payMode === 'Offline' && status === 'Payment Received') {
    return (
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-black text-teal-900 text-lg">Offline Payment Received ✅</p>
            <p className="text-sm text-teal-600 font-medium">Payment collected by staff. Awaiting admin closure.</p>
          </div>
        </div>
        {complaint.payment?.paidAt && (
          <p className="mt-3 text-xs text-teal-700 font-bold">
            Received at: {new Date(complaint.payment.paidAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  // No payment section needed for other statuses
  return null;
};

export default PaymentSection;
