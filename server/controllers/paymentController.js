import Razorpay from 'razorpay';
import crypto from 'crypto';
import Complaint from '../models/Complaint.js';
import { createNotification } from '../services/notificationService.js';
import {
  HTTP_STATUS,
  COMPLAINT_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  USER_ROLES,
} from '../config/constants.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ====================================
// @desc    Create Razorpay order for a complaint
// @route   POST /api/payments/create-order/:complaintId
// @access  Private (Resident only)
// ====================================
export const createOrder = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId);

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify resident owns this complaint
    const userId = (req.user.id || req.user._id).toString();
    if (complaint.residentId.toString() !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Only allow order creation when complaint is completed (or payment already pending) and pay mode is Online
    if (complaint.status !== COMPLAINT_STATUS.COMPLETED && complaint.status !== COMPLAINT_STATUS.PAYMENT_PENDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Payment can only be initiated after task completion',
      });
    }

    if (complaint.preferredPayMode !== 'Online') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This complaint is set for offline payment',
      });
    }

    // Check if Razorpay is properly configured
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeyId || razorpayKeyId === 'rzp_test_yourkeyid' ||
        !razorpayKeySecret || razorpayKeySecret === 'yourtestkeysecret') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Payment gateway is not configured. Please contact the administrator.',
      });
    }

    // Amount: use fixed amount or from request (in paise — 1 INR = 100 paise)
    const amountInPaise = req.body.amount || 50000; // Default ₹500

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `complaint_${complaint.complaintId}`,
      notes: {
        complaintId: complaint._id.toString(),
        complaintNumber: complaint.complaintId,
        residentId: userId,
      },
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create payment order. Please try again later.',
      });
    }

    // Save order id to complaint
    complaint.payment = {
      razorpayOrderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      status: PAYMENT_STATUS.PENDING,
    };
    complaint.status = COMPLAINT_STATUS.PAYMENT_PENDING;
    complaint.addStatusHistory(
      COMPLAINT_STATUS.PAYMENT_PENDING,
      req.user._id,
      'Online payment initiated'
    );
    await complaint.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: razorpayKeyId,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Verify Razorpay payment signature and complete payment
// @route   POST /api/payments/verify/:complaintId
// @access  Private (Resident only)
// ====================================
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Missing payment details',
      });
    }

    const complaint = await Complaint.findById(req.params.complaintId)
      .populate('residentId', 'name email')
      .populate('assignedTo', 'name email');

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify ownership
    const userId2 = (req.user.id || req.user._id).toString();
    if (complaint.residentId._id.toString() !== userId2) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      // Mark payment as failed
      complaint.payment.status = PAYMENT_STATUS.FAILED;
      await complaint.save();
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Signature valid — update complaint
    complaint.payment.razorpayPaymentId = razorpayPaymentId;
    complaint.payment.razorpaySignature = razorpaySignature;
    complaint.payment.status = PAYMENT_STATUS.COMPLETED;
    complaint.payment.paidAt = new Date();
    complaint.status = COMPLAINT_STATUS.PAYMENT_COMPLETED;
    complaint.addStatusHistory(
      COMPLAINT_STATUS.PAYMENT_COMPLETED,
      req.user._id,
      `Online payment completed. Payment ID: ${razorpayPaymentId}`
    );
    await complaint.save();

    // Notify resident
    await createNotification({
      userId: complaint.residentId._id,
      type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
    });

    // Notify assigned staff
    if (complaint.assignedTo) {
      await createNotification({
        userId: complaint.assignedTo._id,
        type: NOTIFICATION_TYPES.PAYMENT_COMPLETED,
        complaintId: complaint._id,
        complaintNumber: complaint.complaintId,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment verified and recorded successfully',
      data: {
        complaint,
        payment: complaint.payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Staff confirms offline payment received
// @route   PUT /api/payments/offline-received/:complaintId
// @access  Private (Staff only)
// ====================================
export const confirmOfflinePayment = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId)
      .populate('residentId', 'name email');

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify staff is assigned
    if (complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not assigned to this complaint',
      });
    }

    if (complaint.preferredPayMode !== 'Offline') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This complaint is set for online payment',
      });
    }

    if (complaint.status !== COMPLAINT_STATUS.PAYMENT_PENDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Complaint is not awaiting offline payment',
      });
    }

    const { amount, remarks } = req.body;

    // Update payment record
    complaint.payment = {
      amount: amount || null,
      currency: 'INR',
      status: PAYMENT_STATUS.COMPLETED,
      paidAt: new Date(),
    };
    complaint.status = COMPLAINT_STATUS.PAYMENT_RECEIVED;
    complaint.addStatusHistory(
      COMPLAINT_STATUS.PAYMENT_RECEIVED,
      req.user._id,
      remarks || 'Offline payment collected by staff'
    );
    await complaint.save();

    // Notify resident
    await createNotification({
      userId: complaint.residentId._id,
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Offline payment confirmed',
      data: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

// ====================================
// @desc    Staff moves completed complaint to Payment Pending (offline)
// @route   PUT /api/payments/request-offline/:complaintId
// @access  Private (Staff only)
// ====================================
export const requestOfflinePayment = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId)
      .populate('residentId', 'name email');

    if (!complaint) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Verify staff is assigned
    if (complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not assigned to this complaint',
      });
    }

    if (complaint.status !== COMPLAINT_STATUS.COMPLETED) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Complaint must be Completed before requesting payment',
      });
    }

    if (complaint.preferredPayMode !== 'Offline') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This complaint is set for online payment',
      });
    }

    complaint.status = COMPLAINT_STATUS.PAYMENT_PENDING;
    complaint.addStatusHistory(
      COMPLAINT_STATUS.PAYMENT_PENDING,
      req.user._id,
      'Awaiting offline payment collection'
    );
    await complaint.save();

    // Notify resident
    await createNotification({
      userId: complaint.residentId._id,
      type: NOTIFICATION_TYPES.PAYMENT_PENDING,
      complaintId: complaint._id,
      complaintNumber: complaint.complaintId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Offline payment request sent to resident',
      data: { complaint },
    });
  } catch (error) {
    next(error);
  }
};
