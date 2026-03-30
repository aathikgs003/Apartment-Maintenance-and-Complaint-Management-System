import express from 'express';
import sendEmail from '../utils/mailer.js';

const router = express.Router();

router.get('/test-email', async (req, res, next) => {
  try {
    // Priority: query param `to` > EMAIL_TEST_RECIPIENT > authenticated EMAIL_USER
    const toRaw = req.query.to || process.env.EMAIL_TEST_RECIPIENT || process.env.EMAIL_USER;
    const to = typeof toRaw === 'string' ? toRaw.trim() : toRaw;
    if (!to) {
      return res.status(400).json({ success: false, message: 'No recipient configured. Set EMAIL_TEST_RECIPIENT or pass ?to=you@example.com' });
    }

    const result = await sendEmail(to, 'Test Mail', '<h1>Email system working!</h1>', 'Email system working!');

    if (result && result.success) {
      res.json({ success: true, message: 'Mail sent (or logged)', result });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send mail', result });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
