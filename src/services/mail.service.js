import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: '"BildyApp Support" <noreply@bildyapp.com>',
    to: email,
    subject: 'Verify your BildyApp account',
    text: `Welcome to BildyApp! Your verification code is: ${code}`,
    html: `
      <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
        <h1>Welcome to BildyApp</h1>
        <p>Thank you for registering. Please use the code below to verify your account:</p>
        <h2 style="background: #f4f4f4; padding: 10px; display: inline-block;">${code}</h2>
        <p>This code is required for the <code>/api/user/validation</code> endpoint.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};