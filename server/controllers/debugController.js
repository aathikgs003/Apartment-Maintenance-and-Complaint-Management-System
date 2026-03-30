import User from '../models/User.js';
import { HTTP_STATUS } from '../config/constants.js';

export const listStaffDebug = async (req, res, next) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('name expertise isActive email');
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Debug staff list',
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

export default { listStaffDebug };
