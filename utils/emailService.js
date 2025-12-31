// Email sending utility 

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
   try {
     // Create transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        // host: 'smtp.sendgrid.net',
        // port: 587,
        // secure: false,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Define email options
    const mailOptions = {
        from: `User Management System <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully');
      console.log('📧 Message ID:', info.messageId);
      console.log('👤 To:', options.email);

    return info;
    
   } catch (error) {
     console.error('❌ Email sending failed:', error);
      throw new Error(`Email delivery failed: ${error.message}`);
   }
};

// Email templates
const emailVerificationTemplate = (name, verificationUrl) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hello ${name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" 
           style="background-color: #4361ee; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't create an account, please ignore this email.</p>
    </div>
`;

const passwordResetTemplate = (name, resetUrl) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset</h2>
        <p>Hello ${name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" 
           style="background-color: #4361ee; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    </div>
`;

module.exports = { sendEmail, emailVerificationTemplate, passwordResetTemplate };