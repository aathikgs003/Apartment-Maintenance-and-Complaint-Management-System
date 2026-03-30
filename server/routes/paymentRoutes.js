import express from 'express';
import {
  createOrder,
  verifyPayment,
  confirmOfflinePayment,
  requestOfflinePayment,
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/payments/create-order/:complaintId
 * @desc    Create Razorpay order for online payment
 * @access  Private (Resident only)
 */
router.post(
  '/create-order/:complaintId',
  authorize(USER_ROLES.RESIDENT),
  createOrder
);

/**
 * @route   POST /api/payments/verify/:complaintId
 * @desc    Verify Razorpay payment signature and mark as completed
 * @access  Private (Resident only)
 */
router.post(
  '/verify/:complaintId',
  authorize(USER_ROLES.RESIDENT),
  verifyPayment
);

/**
 * @route   PUT /api/payments/request-offline/:complaintId
 * @desc    Staff requests offline payment (moves status to Payment Pending)
 * @access  Private (Staff only)
 */
router.put(
  '/request-offline/:complaintId',
  authorize(USER_ROLES.STAFF),
  requestOfflinePayment
);

/**
 * @route   PUT /api/payments/offline-received/:complaintId
 * @desc    Staff confirms offline payment received
 * @access  Private (Staff only)
 */
router.put(
  '/offline-received/:complaintId',
  authorize(USER_ROLES.STAFF),
  confirmOfflinePayment
);

export default router;
