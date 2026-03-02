const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(to, otp) {
    const mailOptions = {
        from: `"VoteApp" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify Your VoteApp Account',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0d2e; color: #e2e8f0; border-radius: 16px;">
                <h2 style="color: #a5b4fc; margin-bottom: 8px;">Email Verification</h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Use the code below to verify your VoteApp account. This code expires in 10 minutes.</p>
                <div style="background: #1e1b4b; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #818cf8;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 12px;">If you didn't create a VoteApp account, ignore this email.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { generateOTP, sendOTPEmail };
