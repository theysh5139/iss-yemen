import bcrypt from 'bcrypt';
import { User } from '../models/User.model.js';
import { addMinutes, generateRandomToken, hashToken } from '../utils/tokens.js';
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
      emailVerificationTokenExpiresAt
    });

    const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(
      email
    )}`;

    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Welcome! Verify your email: ${verifyUrl}`,
      html: `<p>Welcome!</p><p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    });

    return res.status(201).json({
      message: 'Signup successful. Please verify your email.',
      user: { id: user._id.toString(), email: user.email, name: user.name, emailVerified: user.isEmailVerified() }
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

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isEmailVerified()) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    const token = signAccessToken({ sub: user._id.toString(), role: user.role });
    res.cookie('access_token', token, authCookieOptions());
    return res.json({
      message: 'Login successful',
      user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role }
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
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Reset your password using this link: ${link}`,
        html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p>`
      });
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
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Verify your email: ${verifyUrl}`,
      html: `<p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    });

    const includeLink = process.env.NODE_ENV !== 'production';
    return res.json({ message: 'Verification link sent', verifyUrl: includeLink ? verifyUrl : undefined });
  } catch (err) {
    next(err);
  }
}


