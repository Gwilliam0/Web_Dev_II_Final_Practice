import User from '../models/User.js';
import Company from '../models/Company.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { handleHttpError } from '../utils/handleError.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/handleJwt.js';

// Login - login to existing user and generate both tokens
export const login = async (req, res) => {  
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(404).json({ error: true, message: 'User not found' });
  }

  if (!(await compare(password, user.password))) {
    return res.status(401).json({ error: true, message: 'Invalid credentials' });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Save refresh token in database with user reference and expiry
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: getRefreshTokenExpiry(),
    createdByIp: req.ip
  });

  // Hide password
  user.password = undefined;

  res.json({
    accessToken,
    refreshToken,
    user
  });
};

// Register - create user and generate tokens
export const register = async (req, res) => {
  try {
    // Verify if email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);
      return;
    }
    
    // Encrypt password
    const password = await encrypt(req.body.password);

    // Create random 6-digit verification code for email validation
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    
    // Create user with encrypted password
    const body = { ...req.body, password, verificationCode };
    const dataUser = await User.create(body);
    
    // Hide password in the response
    dataUser.set('password', undefined, { strict: false });

    // Generate tokens
    const accessToken = generateAccessToken(dataUser);
    const refreshToken = generateRefreshToken();

    // Save refresh token in database with user reference and expiry
    await RefreshToken.create({
      token: refreshToken,
      user: dataUser._id,
      expiresAt: getRefreshTokenExpiry(),
      createdByIp: req.ip
    });
    
    res.status(201).send({ accessToken, refreshToken, user: dataUser });
  } catch (err) {
    console.log(err);
    handleHttpError(res, 'ERROR_REGISTER_USER');
  }
};

// Obtain a new access token using the refresh token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: true, message: 'Refresh token required' });
  }

  // Search in database
  const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

  if (!storedToken || !storedToken.isActive()) {
    return res.status(401).json({ error: true, message: 'Refresh token invalid or expired' });
  }

  // Generate new access token
  const accessToken = generateAccessToken(storedToken.user);

  res.json({ accessToken });
};

// Logout - revoke refresh token
export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revokedAt: new Date(), revokedByIp: req.ip }
    );
    res.json({ message: 'Session closed' });
  } else {
    res.status(400).json({ message: 'Refresh token required for logout' });
  }
};

// Validate email with verification code
export const validateEmail = async (req, res) => {
  const { code } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.status === 'verified') return res.status(400).json({ message: 'Email already verified' });

  if (user.verificationAttempts <= 0) {
    return res.status(429).json({ message: 'Out of attempts' });
  }

  if (user.verificationCode === code) {
    user.status = 'verified';
    user.verificationCode = null;
    await user.save();
    return res.json({ message: 'Email verified' });
  }

  user.verificationAttempts -= 1;
  await user.save();
  return res.status(400).json({
    message: `Invalid code. Remaining attempts: ${user.verificationAttempts}`,
  });
};

// Update user profile (name, lastName, nif)
export const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, lastName, nif } = req.body;

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (lastName) user.lastName = lastName;
    if (nif) user.nif = nif;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    handleHttpError(res, 'ERROR_UPDATING_PROFILE');
  }
};

// Create company for user or assign to existing company by CIF
export const updateCompany = async (req, res) => {
  const { name, cif, address, isFreelance } = req.body;
  const user = req.user;

  let company;

  if (isFreelance) {
    company = await Company.create({
      owner: user._id,
      name: `${user.name} ${user.lastName}`,
      cif: user.nif,
      address: user.address || {},
      isFreelance: true,
    });
  } else {
    company = await Company.findOne({ cif });
    if (!company) {
      company = await Company.create({ owner: user._id, name, cif, address });
    } else {
      company.isFreelance = false;
      await company.save();
      user.role = 'guest';
    }
  }

  user.company = company._id;
  await user.save();

  res.json({ user, company });
};

export const updateLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const user = await User.findById(req.user._id);
    if (!user.company) return res.status(400).json({ message: 'User has no company associated' });

    // Assuming multer saves to 'upload/' and we store the path
    const { filename } = req.file;
    const logoUrl = `.../../upload/${filename}`;
    
    const company = await Company.findByIdAndUpdate(
      user.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ message: 'Logo updated successfully', logo: company.logo });
  } catch (err) {
    handleHttpError(res, 'ERROR_UPDATING_LOGO');
  }
};

export const getUser = async (req, res) => {
  const user = await User.findById(req.user._id).populate('company').lean();
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const deleteAccount = async (req, res) => {
  try {
    const { soft } = req.query;
    const userId = req.user._id;

    if (soft === 'true') {
      await User.findByIdAndUpdate(userId, { deleted: true });
    } else {
      await User.findByIdAndDelete(userId);
      await RefreshToken.findOneAndDelete({ user: userId });
    }

    res.json({ message: `User deleted successfully (${soft === 'true' ? 'soft' : 'hard'})` });
  } catch (err) {
    handleHttpError(res, 'ERROR_DELETING_USER');
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password incorrect' });
    }

    user.password = await encrypt(newPassword);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    handleHttpError(res, 'ERROR_UPDATING_PASSWORD');
  }
};

export const sendInvite = async (req, res) => {
  try {
    const { email, name, lastName } = req.body;
    const adminUser = req.user;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const newUser = await User.create({
      email,
      name,
      lastName,
      role: 'guest',
      company: adminUser.company,
      status: 'pending',
      password: await encrypt(Math.random().toString(36).slice(-10)) 
    });

    res.status(201).json({ message: 'User invited successfully', user: newUser });
  } catch (err) {
    handleHttpError(res, 'ERROR_INVITING_USER');
  }
};