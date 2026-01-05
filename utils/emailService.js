// utils/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'gmail';
  }

  // Create transporter based on provider
  async createTransporter() {
    switch (this.provider) {
      case 'gmail':
        return this.createGmailTransporter();
      case 'sendgrid':
        return this.createSendGridTransporter();
      case 'mailgun':
        return this.createMailgunTransporter();
      default:
        throw new Error(`Unsupported email provider: ${this.provider}`);
    }
  }

  // Gmail Transporter
  createGmailTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
      },
      // connectionTimeout: 10000,
      // greetingTimeout: 10000,
      // socketTimeout: 10000,
    });
  }

  // SendGrid Transporter
  createSendGridTransporter() {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey', // This is literally 'apikey'
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Mailgun Transporter
  createMailgunTransporter() {
    return nodemailer.createTransport({
      host: process.env.MAILGUN_SMTP_SERVER,
      port: process.env.MAILGUN_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD
      }
    });
  }

  // Send email
  async sendEmail(options) {
    try {
      if (!options.to) {
        throw new Error('Recipient email (to) is required');
      }

      const transporter = await this.createTransporter();
      
      const mailOptions = {
        from: this.getFromAddress(),
        to: options.to,
        subject: options.subject,
        text: options.message,
        html: options.html
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully');
      console.log('📧 Message ID:', info.messageId);
      console.log('👤 To:', options.to);
      
      return info;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  // Get from address based on provider
  getFromAddress() {
    const fromName = 'User Management System';
    
    switch (this.provider) {
      case 'gmail':
        return `"${fromName}" <${process.env.EMAIL_USERNAME}>`;
      case 'sendgrid':
        return `"${fromName}" <${process.env.SENDGRID_FROM_EMAIL}>`;
      case 'mailgun':
        return `"${fromName}" <${process.env.MAILGUN_FROM_EMAIL}>`;
      default:
        return `"${fromName}" <${process.env.EMAIL_USERNAME}>`;
    }
  }

  // Verify email configuration
  async verifyConfiguration() {
    try {
      const transporter = await this.createTransporter();
      await transporter.verify();
      console.log(`✅ ${this.provider.toUpperCase()} email configuration is correct`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.provider.toUpperCase()} configuration error:`, error);
      return false;
    }
  }
}

// Email templates (keep your existing ones)

const emailVerificationTemplate = (name, verificationUrl) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4361ee; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { 
            background: #4361ee; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
            margin: 20px 0;
        }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to our User Management System! Please verify your email address to complete your registration.</p>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button" style="color: white; text-decoration: none;">
                    Verify Email Address
                </a>
            </div>
            
            <p><strong>Or copy and paste this link in your browser:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; word-break: break-all;">
                ${verificationUrl}
            </div>
            
            <p style="color: #666; margin-top: 20px;">
                <strong>Note:</strong> This verification link will expire in 1 hour.<br>
                If you didn't create an account, please ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} User Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const passwordResetTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
                <a href="${resetUrl}">${resetUrl}</a>
            </p>
            
            <p>This reset link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} User Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Create singleton instance
const emailService = new EmailService();

module.exports = {
  emailService,
  emailVerificationTemplate,
  passwordResetTemplate,
  sendEmail: (options) => emailService.sendEmail(options),
  verifyConfiguration: () => emailService.verifyConfiguration()
};