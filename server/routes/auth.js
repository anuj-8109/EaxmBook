import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import OtpToken from '../models/OtpToken.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendOtpEmail, getSettings } from '../services/mailer.js';

const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d',
  });

const buildUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  full_name: user.full_name,
  avatar_url: user.avatar_url,
  username: user.username,
  role: user.role,
});

// Generate unique username from email
const generateUsernameFromEmail = async (email) => {
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  let username = baseUsername;
  let counter = 1;
  
  // Check if username exists, if yes, append numbers
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }
  
  return username;
};

const createOtpToken = async ({ email, type, payload }) => {
  const normalizedEmail = email.toLowerCase();
  await OtpToken.deleteMany({ email: normalizedEmail, type, consumed: false });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otp = await OtpToken.create({
    email: normalizedEmail,
    code,
    type,
    payload,
    expires_at,
  });

  await sendOtpEmail({ to: normalizedEmail, code, type });
  return otp;
};

const verifyOtpToken = async ({ email, code, type }) => {
  const otp = await OtpToken.findOne({ email: email.toLowerCase(), type })
    .sort({ created_at: -1 })
    .exec();

  if (!otp) {
    throw new Error('Invalid or expired code.');
  }

  if (otp.consumed) {
    throw new Error('This code has already been used.');
  }

  if (otp.expires_at < new Date()) {
    throw new Error('This code has expired.');
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error('Too many invalid attempts. Please request a new code.');
  }

  if (otp.code !== code) {
    otp.attempts += 1;
    await otp.save();
    throw new Error('Invalid verification code.');
  }

  otp.consumed = true;
  otp.consumed_at = new Date();
  await otp.save();

  return otp;
};

router.post('/register/request-otp', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists. Try logging in instead.' });
    }

    await createOtpToken({
      email,
      type: 'register',
      payload: {
        full_name: fullName,
        password: await bcrypt.hash(password, 10),
      },
    });

    res.json({ message: 'Verification code sent to email.' });
  } catch (error) {
    console.error('Register OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send verification code' });
  }
});

router.post('/register/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const otp = await verifyOtpToken({ email, code, type: 'register' });
    if (!otp.payload?.password || !otp.payload?.full_name) {
      return res.status(400).json({ error: 'Invalid verification payload' });
    }

    const username = await generateUsernameFromEmail(email);
    const user = new User({
      email: email.toLowerCase(),
      full_name: otp.payload.full_name,
      username: username,
      role: 'user',
    });
    user.password = otp.payload.password;
    user.$locals = { skipHash: true };
    await user.save();

    const token = generateToken(user._id);
    res.json({ user: buildUserResponse(user), token });
  } catch (error) {
    console.error('Verify register OTP error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify code' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ user: buildUserResponse(user), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/otp/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    await createOtpToken({ email, type: 'login' });
    res.json({ message: 'Verification code sent to email.' });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to send code' });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    await verifyOtpToken({ email, code, type: 'login' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateToken(user._id);
    res.json({ user: buildUserResponse(user), token });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify code' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    await createOtpToken({ email, type: 'reset' });
    res.json({ message: 'Password reset code sent to email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Failed to send reset code' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    await verifyOtpToken({ email, code, type: 'reset' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = password;
    await user.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: error.message || 'Failed to reset password' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    const settings = await getSettings();
    const clientId = settings.google?.clientId;
    if (!clientId) {
      return res.status(400).json({ error: 'Google login is not configured' });
    }

    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      const username = await generateUsernameFromEmail(payload.email);
      user = new User({
        email: payload.email.toLowerCase(),
        full_name: payload.name || payload.email.split('@')[0],
        username: username,
        role: 'user',
        avatar_url: payload.picture || null,
        password: crypto.randomBytes(16).toString('hex'),
      });
      await user.save();
    }

    const token = generateToken(user._id);
    res.json({ user: buildUserResponse(user), token });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: error.message || 'Failed to login with Google' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: buildUserResponse(req.user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile (full_name, username)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, username } = req.body;
    const user = req.user;

    if (full_name !== undefined) {
      if (!full_name || full_name.trim().length === 0) {
        return res.status(400).json({ error: 'Full name is required' });
      }
      user.full_name = full_name.trim();
    }

    if (username !== undefined) {
      if (username && username.trim().length > 0) {
        const trimmedUsername = username.trim().toLowerCase();
        // Check if username is already taken by another user
        const existingUser = await User.findOne({ 
          username: trimmedUsername,
          _id: { $ne: user._id }
        });
        if (existingUser) {
          return res.status(400).json({ error: 'Username already taken' });
        }
        user.username = trimmedUsername;
      } else {
        user.username = null;
      }
    }

    await user.save();
    res.json({ user: buildUserResponse(user), message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Update avatar
router.put('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    const user = req.user;

    if (!avatar_url) {
      return res.status(400).json({ error: 'Avatar URL is required' });
    }

    user.avatar_url = avatar_url;
    await user.save();
    res.json({ user: buildUserResponse(user), message: 'Avatar updated successfully' });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: error.message || 'Failed to update avatar' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = req.user;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(current_password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = new_password;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
});

export default router;

