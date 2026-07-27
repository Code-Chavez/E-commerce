import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '@infrastructure/http/controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Registration endpoint (HU-002)
router.post('/register', authController.register);

// Account verification endpoint (HU-002 / T-017)
router.post('/verify', authController.verify);

// Login endpoint (HU-094 / T-022)
router.post('/login', authController.login);

// Token refresh with sliding window (RSK-001 / T-043)
router.post('/refresh', authController.refresh.bind(authController));

// Forgot password endpoint (HU-003 / T-027)
router.post('/forgot-password', authController.forgotPassword);

// Reset password endpoint (HU-003 / T-028)
router.post('/reset-password', authController.resetPassword);

// Google OAuth 2.0 — Initiate flow (HU-001 / T-033)
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

// Google OAuth 2.0 — Callback (HU-001 / T-033)
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback,
);

// Session extraction from cookie (HU-001 / T-036)
router.get('/me', authController.me);

export default router;
