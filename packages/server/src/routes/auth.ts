/**
 * Authentication routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { RegisterRequest, LoginRequest } from '../types/index.js';
import * as authService from '../services/auth-service.js';
import { requireAuth } from '../middleware/auth-middleware.js';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const result = await authService.register(email, password, name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.user,
      token: result.session?.access_token,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required',
      });
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/logout
 * Logout user
 */
authRouter.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || '';
    await authService.logout(token);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
