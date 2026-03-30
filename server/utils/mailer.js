import nodemailer from 'nodemailer';

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const e = email.trim();
  // Simple validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};

const sendEmail = async (to, subject, html, text) => {
  if (!to || !isValidEmail(to)) {
    const msg = `Invalid recipient email: "${String(to)}"`;
    console.warn(msg);
    return { success: false, error: msg };
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email transport not configured; skipping send.');
    return { success: true, info: 'logging-only' };
  }

  // Use the authenticated mailbox as the envelope from to avoid SMTP rejections
  const fromName = process.env.EMAIL_FROM_NAME || 'Apartment Maintenance System';
  const fromAddress = process.env.EMAIL_USER; // use authenticated user as sender
  const from = `${fromName} <${fromAddress}>`;

  // Allow reply-to to be a different address if explicitly configured
  const replyTo = process.env.EMAIL_FROM || undefined;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      replyTo,
    });

    console.log(`Email sent to ${to}; messageId=${info.messageId}`);
    return { success: true, info };
  } catch (err) {
    console.error('Error sending email:', err && err.message ? err.message : err);
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
};

export default sendEmail;
