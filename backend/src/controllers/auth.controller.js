import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';
import { addMinutes, addSeconds, generateRandomToken, generateOTP, hashToken } from '../utils/tokens.js';
import { sendEmail } from '../utils/email.js';
import { signAccessToken, authCookieOptions } from '../utils/jwt.js';

const EMAIL_TOKEN_TTL_MIN = 60; // 1 hour

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const emailVerificationToken = generateRandomToken(32);
    const emailVerificationTokenHash = hashToken(emailVerificationToken);
    const emailVerificationTokenExpiresAt = addMinutes(new Date(), EMAIL_TOKEN_TTL_MIN);

    const user = await User.create({
      name: name || undefined,
      email,
      passwordHash,
      emailVerificationTokenHash,
      emailVerificationTokenExpiresAt,
      role: 'member' // Automatically set new users as members
    });

    const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(
      email
    )}`;

    // Attempt to send verification email
    let emailSent = false;
    let verifyUrlInResponse = null;
    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email',
        text: `Welcome! Verify your email: ${verifyUrl}`,
        html: `<p>Welcome!</p><p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
      });
      emailSent = true;
      // Include verifyUrl in response only in development/mock mode
      if (process.env.NODE_ENV !== 'production') {
        verifyUrlInResponse = verifyUrl;
      }
    } catch (emailError) {
      // Log the error but don't fail the signup - user can request resend later
      console.error('Failed to send verification email during signup:', emailError.message);
      // In development, still include the URL so they can manually verify
      if (process.env.NODE_ENV !== 'production') {
        verifyUrlInResponse = verifyUrl;
      }
    }

    return res.status(201).json({
      message: emailSent
        ? 'Signup successful. Please verify your email.'
        : 'Signup successful, but verification email could not be sent. Please use resend verification.',
      user: { id: user._id.toString(), email: user.email, name: user.name, emailVerified: user.isEmailVerified() },
      ...(verifyUrlInResponse && { verifyUrl: verifyUrlInResponse })
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).json({ message: 'Invalid verification link' });

    const tokenHash = hashToken(String(token));
    const user = await User.findOne({ email: String(email).toLowerCase(), emailVerificationTokenHash: tokenHash });
    if (!user) return res.status(400).json({ message: 'Invalid or already used token' });

    if (!user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification token expired' });
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpiresAt = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isEmailVerified()) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // Direct login for all users - bypassing OTP
    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.cookie('access_token', token, authCookieOptions());

    // Clear any existing OTP data just in case
    if (user.otp || user.otpExpires || user.failedOtpAttempts > 0) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.failedOtpAttempts = 0;
      user.lockoutUntil = undefined;
      await user.save();
    }

    return res.json({
      message: 'Login successful',
      token, // Return token for client-side storage
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
    });

  } catch (err) {
    next(err);
  }
}
export async function verifyOTP(req, res, next) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or OTP' });
    }

    // Check if user is locked out
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const secondsRemaining = Math.ceil((user.lockoutUntil - new Date()) / 1000);
      return res.status(429).json({
        message: `Account temporarily locked. Please try again in ${secondsRemaining} seconds.`,
        lockoutSeconds: secondsRemaining
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ message: 'No OTP found. Please request a new OTP by logging in again.' });
    }

    // Check if OTP is expired (U13 - OTP Expiration)
    if (user.otpExpires < new Date()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP by logging in again.' });
    }

    // Verify OTP (hashed comparison)
    const otpHash = hashToken(String(otp));
    const isOtpValid = otpHash === user.otp;

    if (!isOtpValid) {
      // Increment failed attempts
      user.failedOtpAttempts = (user.failedOtpAttempts || 0) + 1;

      // Lock out after 3 failed attempts (U14 - Invalid OTP Error with lockout)
      if (user.failedOtpAttempts >= 3) {
        user.lockoutUntil = addSeconds(new Date(), 30); // Lock for 30 seconds
        await user.save();
        return res.status(429).json({
          message: 'Too many failed attempts. Account locked for 30 seconds.',
          lockoutSeconds: 30
        });
      }

      await user.save();

      // U14 - Invalid OTP Error: Return clear error message
      const attemptsRemaining = 3 - user.failedOtpAttempts;
      return res.status(400).json({
        message: `Invalid OTP. ${attemptsRemaining} attempt(s) remaining before account lockout.`,
        attemptsRemaining
      });
    }

    // OTP is valid - complete login
    // Clear OTP data
    user.otp = undefined;
    user.otpExpires = undefined;
    user.failedOtpAttempts = 0;
    user.lockoutUntil = undefined;
    await user.save();

    // Issue JWT token
    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.cookie('access_token', token, authCookieOptions());

    return res.json({
      message: 'Login successful',
      token, // Return token for client-side storage
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

export async function resendOTP(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ message: 'If an account exists, a new OTP has been sent to your email.' });
    }

    // Check if user is locked out
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const secondsRemaining = Math.ceil((user.lockoutUntil - new Date()) / 1000);
      return res.status(429).json({
        message: `Account temporarily locked. Please try again in ${secondsRemaining} seconds.`,
        lockoutSeconds: secondsRemaining
      });
    }

    // Cooldown check: prevent resending OTP too frequently (30 seconds cooldown)
    if (user.otpExpires) {
      const secondsUntilExpiry = Math.floor((user.otpExpires - new Date()) / 1000);
      // If OTP was sent less than 30 seconds ago (i.e., expires in more than 30 seconds), enforce cooldown
      if (secondsUntilExpiry > 30) {
        const cooldownRemaining = secondsUntilExpiry - 30;
        return res.status(429).json({
          message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
          cooldownSeconds: cooldownRemaining
        });
      }
    }

    // Generate new 6-digit OTP
    const otp = generateOTP();
    const otpHash = hashToken(otp);
    const otpExpires = addSeconds(new Date(), 60); // Expires in 60 seconds

    // Generate email content
    const emailContent = {
      to: user.email,
      subject: 'Your Login Verification Code',
      text: `Your verification code is: ${otp}\n\nThis code will expire in 60 seconds.\n\nIf you did not request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Login Verification Code</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 8px; color: #2563eb; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>60 seconds</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you did not request this code, please ignore this email.</p>
        </div>
      `
    };

    // Send OTP via email FIRST, then save to database
    // This ensures email is sent before we commit the OTP to the database
    let emailSent = false;
    try {
      const emailResult = await sendEmail(emailContent);
      emailSent = true;
      console.log(`✅ OTP email resent successfully to ${user.email}`);

      // In development, log OTP to console for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Resent OTP for ${user.email}: ${otp}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send OTP email during resend:', emailError.message);
      console.error('Email error details:', emailError);

      // In development, log OTP to console even if email fails
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Email failed, but OTP for ${user.email}: ${otp}`);
      }

      // Return error - don't save OTP if email fails
      return res.status(500).json({
        message: 'Failed to send OTP email. Please try again later.',
        error: process.env.NODE_ENV !== 'production' ? emailError.message : undefined
      });
    }

    // Only update user with new OTP after email is successfully sent
    if (emailSent) {
      user.otp = otpHash;
      user.otpExpires = otpExpires;
      user.failedOtpAttempts = 0; // Reset failed attempts on resend
      user.lockoutUntil = undefined; // Clear lockout on new OTP
      await user.save();
    }

    return res.json({
      message: 'A new OTP has been sent to your email.',
      email: user.email
    });
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  const opts = authCookieOptions();
  res.clearCookie('access_token', { ...opts, maxAge: 0 });
  return res.json({ message: 'Logged out' });
}

const RESET_TOKEN_TTL_MIN = 60; // 1 hour

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    // Always respond 200 for privacy; send email only if user exists
    if (user) {
      const rawToken = generateRandomToken(32);
      user.passwordResetTokenHash = hashToken(rawToken);
      user.passwordResetTokenExpiresAt = addMinutes(new Date(), RESET_TOKEN_TTL_MIN);
      await user.save();

      const baseUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
      const link = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your password',
          text: `Reset your password using this link: ${link}`,
          html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p>`
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError.message);
        // Still return success for privacy (don't reveal if email exists)
        // But log the error for debugging
      }
    }
    return res.json({ message: 'If the email exists, reset instructions have been sent' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, email, newPassword } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.passwordResetTokenHash) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    const tokenHash = hashToken(String(token));
    if (tokenHash !== user.passwordResetTokenHash) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save();

    // Optional: invalidate cookie by clearing it
    const opts = authCookieOptions();
    res.clearCookie('access_token', { ...opts, maxAge: 0 });

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const email = String(req.body.email).toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If the email exists, a link has been sent' });
    if (user.isEmailVerified()) return res.json({ message: 'Email already verified' });

    const token = generateRandomToken(32);
    user.emailVerificationTokenHash = hashToken(token);
    user.emailVerificationTokenExpiresAt = addMinutes(new Date(), EMAIL_TOKEN_TTL_MIN);
    await user.save();

    const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail({
        to: email,
        subject: 'Verify your email',
        text: `Verify your email: ${verifyUrl}`,
        html: `<p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
      });

      const includeLink = process.env.NODE_ENV !== 'production';
      return res.json({
        message: 'Verification link sent',
        verifyUrl: includeLink ? verifyUrl : undefined
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
      // In development, still return the URL so they can manually test
      const includeLink = process.env.NODE_ENV !== 'production';
      return res.status(500).json({
        message: 'Failed to send verification email. Please check server logs.',
        verifyUrl: includeLink ? verifyUrl : undefined // Include URL in dev mode for testing
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    // User is already authenticated by the middleware and attached to req.user
    const user = await User.findById(req.user.id).select('-passwordHash -otp -otpExpires -emailVerificationTokenHash -emailVerificationTokenExpiresAt -passwordResetTokenHash -passwordResetTokenExpiresAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.isEmailVerified()
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If email is being updated, check if it's already in use by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase();
      // If email changes, reset email verification status
      user.emailVerifiedAt = null;
    }

    // Update name if provided
    if (name !== undefined) {
      user.name = name || undefined;
    }

    await user.save();

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.isEmailVerified()
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    next(err);
  }
}


