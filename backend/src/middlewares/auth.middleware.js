import { verifyAccessToken } from '../utils/jwt.js';

export function authenticate(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = { id: decoded.sub, role: decoded.role };
    }
    next();
  } catch (err) {
    // Continue without authentication
    next();
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}


