const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = async () => {
  // For development: Use Ethereal (fake SMTP) or Gmail
  // For production: Use real SMTP service (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development: Use Gmail or create Ethereal account
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }
};

module.exports = createTransporter;