/**
 * Authentication Middleware
 * Protects routes and adds user info to request
 */

import type { Request, Response, NextFunction } from 'express';
import { getUserFromToken, getUserFromApiKey } from '../services/auth-service.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string | null;
        subscriptionTier: string;
        apiKey: string;
      };
    }
  }
}

/**
 * Require authentication (JWT token)
 * Expects: Authorization: Bearer <token>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const user = await getUserFromToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Require API key authentication
 * Expects: X-API-Key: omni_xxxxx
 */
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'No API key provided',
      });
      return;
    }

    const user = await getUserFromApiKey(apiKey);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
      return;
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Optional authentication
 * Adds user to request if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const user = await getUserFromToken(token);

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

/**
 * Check subscription tier
 */
export function requireSubscription(tier: 'free' | 'pro' | 'enterprise') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const tierOrder = { free: 0, pro: 1, enterprise: 2 };
    const userTier = tierOrder[req.user.subscriptionTier as keyof typeof tierOrder] || 0;
    const requiredTier = tierOrder[tier];

    if (userTier < requiredTier) {
      res.status(403).json({
        success: false,
        error: `This feature requires ${tier} subscription or higher`,
        currentTier: req.user.subscriptionTier,
        requiredTier: tier,
      });
      return;
    }

    next();
  };
}
