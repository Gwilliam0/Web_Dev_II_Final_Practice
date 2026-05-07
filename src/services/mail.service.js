import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  try {
    const mailOptions = {
      from: `"BildyApp Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your BildyApp account',
      text: `Welcome! Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to BildyApp!</h2>
          <p>Please use the following code to complete your registration:</p>
          <h1 style="color: #007bff;">${code}</h1>
          <p>This code is required to activate your account.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('FAILED_TO_SEND_EMAIL');
  }
};