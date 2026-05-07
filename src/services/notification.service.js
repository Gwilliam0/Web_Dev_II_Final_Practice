const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

const dataUser = await User.create({
  ...req.body,
  password,
  verificationCode,
  verificationAttempts: 3,
  role: 'admin',
});