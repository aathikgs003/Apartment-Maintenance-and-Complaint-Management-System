import express from 'express';
import { listStaffDebug } from '../controllers/debugController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../config/constants.js';

const router = express.Router();

// Protected: admin only
router.get('/staff', protect, authorize(USER_ROLES.ADMIN), listStaffDebug);

export default router;
