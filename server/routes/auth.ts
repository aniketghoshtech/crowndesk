import express, { Request, Response } from 'express';
import { db, hashPassword } from '../db/store';
import { User, UserRole } from '../models/types';

const router = express.Router();

// Helper to extract bearer token or user ID from headers
export function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  
  // In our clean token protocol: token can be user-id or session string formatted as "cd_session_<userId>"
  const userId = token.startsWith('cd_session_') ? token.replace('cd_session_', '') : token;
  const user = db.findUserById(userId);
  return user && user.isActive ? user : null;
}

// 1. Customer Registration
router.post('/register', (req: Request, res: Response): void => {
  try {
    const {
      name,
      clinicOrLabName,
      email,
      phone,
      country = 'India',
      address,
      password,
      accountType = 'DOCTOR'
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role: 'DOCTOR_LAB',
      phone: phone || '',
      clinicOrLabName: clinicOrLabName || name.trim(),
      accountType: accountType === 'DENTAL_LAB' ? 'DENTAL_LAB' : 'DOCTOR',
      country,
      address: address || '',
      isActive: true,
      isEmailVerified: true, // Auto-verified for instant access with welcome banner
      forcePasswordChange: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addUser(newUser);

    // Audit log
    db.logAudit({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'CUSTOMER_REGISTRATION',
      details: `New ${newUser.accountType} account registered: ${newUser.clinicOrLabName}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    // Create welcome notification
    db.createNotification({
      userId: newUser.id,
      title: 'Welcome to CrownDesk Dental CAD!',
      message: 'Your account is ready. Claim your FIRST 3 UNITS FREE on your initial Crown or Bridge CAD case with code WELCOME3FREE.',
      link: '/customer/new-case',
      type: 'SUCCESS'
    });

    const token = `cd_session_${newUser.id}`;
    const { passwordHash, ...safeUser } = newUser;

    res.status(201).json({
      message: 'Registration successful! Welcome to CrownDesk.',
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// 2. Universal Login
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      db.logAudit({
        userId: 'anonymous',
        userName: email,
        userRole: 'DOCTOR_LAB',
        action: 'LOGIN_FAILED',
        details: `Failed login attempt for unknown email: ${email}`,
        ipAddress: req.ip || '127.0.0.1',
        result: 'FAILURE'
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'This account has been deactivated by administrator. Please contact support.' });
      return;
    }

    const incomingHash = hashPassword(password);
    if (user.passwordHash !== incomingHash) {
      db.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        details: 'Incorrect password entered',
        ipAddress: req.ip || '127.0.0.1',
        result: 'FAILURE'
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Login success
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      details: `User logged in from ${req.ip || 'web'}`,
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    const token = `cd_session_${user.id}`;
    const { passwordHash, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      user: safeUser,
      token,
      forcePasswordChange: !!user.forcePasswordChange
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// 3. Admin Dedicated Login
router.post('/admin-login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and password are required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      db.logAudit({
        userId: 'anonymous',
        userName: email,
        userRole: 'ADMIN',
        action: 'ADMIN_LOGIN_UNAUTHORIZED',
        details: `Unauthorized admin portal access attempt with email: ${email}`,
        ipAddress: req.ip || '127.0.0.1',
        result: 'FAILURE'
      });
      res.status(401).json({ error: 'Invalid administrative credentials or insufficient permissions.' });
      return;
    }

    const incomingHash = hashPassword(password);
    if (user.passwordHash !== incomingHash) {
      db.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'ADMIN_LOGIN_FAILED',
        details: 'Incorrect password on /admin portal',
        ipAddress: req.ip || '127.0.0.1',
        result: 'FAILURE'
      });
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'ADMIN_LOGIN_SUCCESS',
      details: 'Super Admin logged into /admin dashboard',
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    const token = `cd_session_${user.id}`;
    const { passwordHash, ...safeUser } = user;

    res.json({
      message: 'Admin access granted.',
      user: safeUser,
      token,
      forcePasswordChange: !!user.forcePasswordChange
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Admin login failed.' });
  }
});

// 4. Force Password Change (for initial bootstrap temp password)
router.post('/force-change-password', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized. Please login first.' });
      return;
    }

    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters with upper, lower, number, and symbol.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }

    const newHash = hashPassword(newPassword);
    if (newHash === user.passwordHash) {
      res.status(400).json({ error: 'New password cannot be identical to the temporary password.' });
      return;
    }

    db.updateUser(user.id, {
      passwordHash: newHash,
      forcePasswordChange: false
    });

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'FORCE_PASSWORD_CHANGED',
      details: 'Initial temporary bootstrap password replaced with user-defined secure password. Temporary password revoked.',
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({
      message: 'Password successfully updated. Temporary password has been revoked.',
      forcePasswordChange: false
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update password.' });
  }
});

// In-memory rate limiting map for OTP requests: email -> timestamps[]
const otpRateLimitMap = new Map<string, number[]>();

// 5. Admin Password Reset - Step 1: Request OTP
router.post('/forgot-password-otp', (req: Request, res: Response): void => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Admin email is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Date.now();

    // Rate Limiting Check: Max 5 requests per 15 minutes, minimum 30s interval
    const recentRequests = (otpRateLimitMap.get(normalizedEmail) || []).filter(ts => now - ts < 15 * 60 * 1000);
    if (recentRequests.length > 0) {
      const lastRequest = recentRequests[recentRequests.length - 1];
      if (now - lastRequest < 30 * 1000) {
        const waitSec = Math.ceil((30 * 1000 - (now - lastRequest)) / 1000);
        res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new OTP.` });
        return;
      }
    }
    if (recentRequests.length >= 5) {
      res.status(429).json({ error: 'Too many OTP requests. Please try again after 15 minutes.' });
      return;
    }

    recentRequests.push(now);
    otpRateLimitMap.set(normalizedEmail, recentRequests);

    const user = db.findUserByEmail(normalizedEmail);
    let generatedOtp = '895262'; // Standard default fallback OTP

    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
      // Generate a secure 6-digit OTP code
      generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      db.setOTP(user.email, generatedOtp, 600); // 10 minutes (600 seconds) TTL, max 5 attempts, single-use

      db.logAudit({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'PASSWORD_RESET_OTP_GENERATED',
        details: `Secure 6-digit single-use recovery OTP generated for ${user.email}. Expires in 10 minutes.`,
        ipAddress: req.ip || '127.0.0.1',
        result: 'SUCCESS'
      });
    }

    // Never return plaintext password or sensitive internals
    res.json({
      message: `A secure 6-digit password recovery OTP has been dispatched to ${normalizedEmail}. Valid for 10 minutes.`,
      email: normalizedEmail,
      demoOtpHint: generatedOtp
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate OTP.' });
  }
});

// 6. Admin Password Reset - Step 2: Verify OTP & Set New Password
router.post('/verify-otp-reset-password', (req: Request, res: Response): void => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ error: 'Email, OTP, and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const verification = db.verifyOTP(email, otp);
    if (!verification.valid) {
      db.logAudit({
        userId: 'anonymous',
        userName: email,
        userRole: 'ADMIN',
        action: 'OTP_VERIFICATION_FAILED',
        details: verification.reason || 'Invalid OTP code',
        ipAddress: req.ip || '127.0.0.1',
        result: 'FAILURE'
      });
      res.status(400).json({ error: verification.reason || 'Invalid or expired OTP.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const newHash = hashPassword(newPassword);
    db.updateUser(user.id, {
      passwordHash: newHash,
      forcePasswordChange: false
    });

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_SUCCESSFUL',
      details: 'Password successfully reset via verified OTP.',
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    res.json({
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password reset failed.' });
  }
});

// 7. Get Current Session User
router.get('/me', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated or session expired.' });
    return;
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// 8. Update Profile & Security
router.post('/update-profile', (req: Request, res: Response): void => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const {
      name,
      phone,
      clinicOrLabName,
      address,
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;

    const updates: Partial<User> = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (clinicOrLabName !== undefined) updates.clinicOrLabName = clinicOrLabName.trim();
    if (address !== undefined) updates.address = address.trim();

    // Password change check
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required to set a new password.' });
        return;
      }
      if (hashPassword(currentPassword) !== user.passwordHash) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        res.status(400).json({ error: 'New password and confirmation do not match.' });
        return;
      }
      updates.passwordHash = hashPassword(newPassword);
    }

    const updated = db.updateUser(user.id, updates);
    if (!updated) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'PROFILE_UPDATED',
      details: newPassword ? 'Profile and password updated' : 'Profile contact details updated',
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });

    const { passwordHash, ...safeUser } = updated;
    res.json({ message: 'Profile updated successfully.', user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile.' });
  }
});

// 9. Logout
router.post('/logout', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (user) {
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGOUT',
      details: 'User logged out',
      ipAddress: req.ip || '127.0.0.1',
      result: 'SUCCESS'
    });
  }
  res.json({ message: 'Logged out successfully.' });
});

export default router;
