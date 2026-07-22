const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    // Simple Gmail transporter (configure in .env)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASS || 'password'
      }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"MealBridge" <noreply@mealbridge.com>',
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ MealBridge</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <div class="footer">
              <p>© 2024 MealBridge. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nWe received a request to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n- MealBridge Team`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your MealBridge Password',
      html,
      text
    });
  }

  async sendEmailVerification(email, verificationToken, userName) {
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ MealBridge</h1>
            <p>Welcome to MealBridge!</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for registering with MealBridge! Please verify your email address to complete your registration:</p>
            <a href="${verifyUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <div class="footer">
              <p>© 2024 MealBridge. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nThank you for registering with MealBridge! Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\n- MealBridge Team`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your MealBridge Account',
      html,
      text
    });
  }

  async sendNewListingNotification(email, userName, listing) {
    const listingUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/ngo-dashboard`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .listing { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ MealBridge</h1>
            <p>New Food Listing Available!</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>A new food listing is available in your area:</p>
            <div class="listing">
              <h3>${listing.title}</h3>
              <p><strong>Category:</strong> ${listing.category}</p>
              <p><strong>Servings:</strong> ${listing.servings} people</p>
              <p><strong>Expires:</strong> ${new Date(listing.expires_at).toLocaleDateString()}</p>
              ${listing.description ? `<p>${listing.description}</p>` : ''}
            </div>
            <a href="${listingUrl}" class="button">View Listing</a>
            <div class="footer">
              <p>© 2024 MealBridge. All rights reserved.</p>
              <p>You can manage your notification preferences in your account settings.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nA new food listing is available:\n\n${listing.title}\nCategory: ${listing.category}\nServings: ${listing.servings}\nExpires: ${new Date(listing.expires_at).toLocaleDateString()}\n\nVisit ${listingUrl} to view and claim this listing.\n\n- MealBridge Team`;

    return this.sendEmail({
      to: email,
      subject: `New Food Available: ${listing.title}`,
      html,
      text
    });
  }

  async sendClaimStatusUpdate(email, userName, listing, status) {
    const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/${status === 'accepted' ? 'ngo' : 'donor'}-dashboard`;

    const statusMessages = {
      accepted: { title: 'Claim Accepted!', message: 'Your claim has been accepted by the donor.' },
      rejected: { title: 'Claim Declined', message: 'Unfortunately, your claim was not accepted.' },
      completed: { title: 'Donation Completed!', message: 'The donation has been marked as completed.' }
    };

    const { title, message } = statusMessages[status];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ MealBridge</h1>
            <p>${title}</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>${message}</p>
            <p><strong>Listing:</strong> ${listing.title}</p>
            <a href="${dashboardUrl}" class="button">View Dashboard</a>
            <div class="footer">
              <p>© 2024 MealBridge. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\n${message}\n\nListing: ${listing.title}\n\nVisit ${dashboardUrl} for more details.\n\n- MealBridge Team`;

    return this.sendEmail({
      to: email,
      subject: `${title} - ${listing.title}`,
      html,
      text
    });
  }

  async sendRatingNotification(email, userName, ratingInfo) {
    const dashboardUrl = `${process.env.CLIENT_URL || 'http://localhost:5174'}/profile`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .rating { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
          .stars { color: #fbbf24; font-size: 24px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ MealBridge</h1>
            <p>You Received a New Rating!</p>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>You have received a new rating from ${ratingInfo.raterName}:</p>
            <div class="rating">
              <div class="stars">${'⭐'.repeat(ratingInfo.score)}</div>
              <p>${ratingInfo.score}/5 stars</p>
              ${ratingInfo.review ? `<p><em>"${ratingInfo.review}"</em></p>` : ''}
            </div>
            <a href="${dashboardUrl}" class="button">View Your Profile</a>
            <div class="footer">
              <p>© 2024 MealBridge. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nYou received a new rating from ${ratingInfo.raterName}:\n\n${'⭐'.repeat(ratingInfo.score)} (${ratingInfo.score}/5)\n${ratingInfo.review ? `\n"${ratingInfo.review}"\n` : ''}\nVisit ${dashboardUrl} to view your profile.\n\n- MealBridge Team`;

    return this.sendEmail({
      to: email,
      subject: 'New Rating Received - MealBridge',
      html,
      text
    });
  }
}

module.exports = new EmailService();