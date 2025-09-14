import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// JWT Secret key - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'mariposa-secret-key-2025';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: { id: number; username: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'mariposa-game'
  });
}

/**
 * Verify JWT token and extract user data
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.warn('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Authentication middleware - validates JWT token from cookies
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Extract JWT token from cookies
    const token = req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required - no token provided',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const userData = verifyToken(token);
    if (!userData) {
      return res.status(401).json({ 
        message: 'Invalid or expired authentication token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user data to request
    req.user = userData;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication system error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * User authorization middleware - ensures user can only access their own resources
 * Must be used after requireAuth middleware
 */
export function requireUserAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Extract user ID from URL parameters or headers
    let requestedUserId: number;
    
    // Check URL parameter first (e.g., /api/user/:id/credits)
    if (req.params.id) {
      requestedUserId = parseInt(req.params.id);
    } 
    // Fallback to x-user-id header for compatibility
    else if (req.headers['x-user-id']) {
      requestedUserId = parseInt(req.headers['x-user-id'] as string);
    }
    // For endpoints without explicit user ID, extract from request body
    else if (req.body?.userId) {
      requestedUserId = parseInt(req.body.userId);
    }
    else {
      return res.status(400).json({ 
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID'
      });
    }

    // Validate that authenticated user matches the requested user
    if (req.user.userId !== requestedUserId) {
      console.warn(`🚨 AUTHORIZATION VIOLATION: User ${req.user.userId} (${req.user.username}) attempted to access resources for user ${requestedUserId}`);
      return res.status(403).json({ 
        message: 'Access denied - you can only access your own resources',
        code: 'ACCESS_DENIED'
      });
    }

    // Add the validated user ID to the request for easy access
    req.validatedUserId = requestedUserId;
    next();
  } catch (error) {
    console.error('User authorization middleware error:', error);
    return res.status(500).json({ 
      message: 'Authorization system error',
      code: 'AUTHZ_ERROR'
    });
  }
}

/**
 * Combined middleware for endpoints that need both authentication and user access control
 */
export function requireAuthenticatedUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    requireUserAccess(req, res, next);
  });
}

/**
 * Optional authentication middleware - adds user data if token is valid, but doesn't require it
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.authToken;
    
    if (token) {
      const userData = verifyToken(token);
      if (userData) {
        req.user = userData;
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      validatedUserId?: number;
    }
  }
}