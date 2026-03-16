/**
 * @fileoverview Authentication API Module
 *
 * Handles all authentication-related HTTP calls:
 * - Registration with email verification
 * - Login with JWT token pair (access + refresh)
 * - Token refresh (handled automatically by ApiClient on 401)
 * - Password reset flow (forgot → email → reset)
 * - Session management (/me, /complete-onboarding)
 *
 * All endpoints are under /auth/* except /users/me and /users/complete-onboarding.
 */

import { api } from './client';
import type { User } from '@/types';

export const authApi = {
  /**
   * Register a new user account.
   * Triggers a verification email — user must verify before logging in.
   *
   * @param data.email - User's email address
   * @param data.password - Password (min 8 chars, validated server-side)
   * @param data.name - Display name
   * @param data.lang - Preferred language for the verification email
   */
  register: (data: { email: string; password: string; name: string; lang?: string }) =>
    api.post<{ message: string }>('/auth/register', data),

  /**
   * Verify email address using OTP/token from verification email.
   * @param token - The verification token sent via email
   */
  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),

  /**
   * Authenticate with email/password credentials.
   * Returns JWT access_token + refresh_token pair.
   * The user object may be included in the response.
   */
  login: (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string; user?: User }>('/auth/login', { email, password }),

  /**
   * Refresh an expired access token using a valid refresh token.
   * Called automatically by the ApiClient on 401 responses.
   */
  refresh: (refreshToken: string) =>
    api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token: refreshToken }),

  /**
   * Invalidate the current session.
   * Sends the refresh token for server-side invalidation.
   */
  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return api.post<{ message: string }>('/auth/logout', refreshToken ? { refresh_token: refreshToken } : undefined);
  },

  /**
   * Request a password reset email.
   * @param email - Account email address
   * @param lang - Language for the reset email template
   */
  forgotPassword: (email: string, lang?: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email, lang }),

  /**
   * Reset password using a token from the reset email.
   * @param token - Password reset token
   * @param password - New password (min 8 chars)
   */
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),

  /**
   * Fetch the current authenticated user's profile.
   * Uses /users/me (not /auth/me) as per backend routing.
   */
  me: () =>
    api.get<User>('/users/me'),

  /**
   * Mark the current user's onboarding as completed.
   * Called after the onboarding wizard finishes.
   * Returns the updated user object with onboarding_completed=true.
   */
  completeOnboarding: () =>
    api.post<User>('/users/complete-onboarding'),

  /**
   * Resend verification email for a pending user.
   * Generates a new OTP and sends a new verification email.
   * @param email - The email address to resend to
   * @param lang - Language for the email template
   */
  resendVerification: (email: string, lang?: string) =>
    api.post<{ message: string }>('/auth/resend-verification', { email, lang }),
};
