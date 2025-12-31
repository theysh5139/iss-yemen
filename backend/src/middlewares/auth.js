import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.model.js';

/**
 * Authentication middleware
 * Verifies JWT token from cookie and attaches user to req.user
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('-passwordHash -otp');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request
      req.user = {
        userId: user._id.toString(),
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    next(error);
  }
}

