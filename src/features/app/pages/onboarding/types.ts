/**
 * @fileoverview Shared types for the onboarding flow.
 */

/** Team member email invitation data */
export interface TeamInvite {
  email: string;
  error?: string;
}

/** Data collected across all onboarding steps */
export interface OnboardingData {
  /** Organization name (required, min 2 chars) */
  orgName: string;
  /** Organization description (optional, max 500 chars) */
  orgDescription: string;
  /** Selected industry key */
  industry: string;
  /** Selected company size range */
  companySize: string;
  /** Selected goal keys (at least one required) */
  goals: string[];
  /** Preferred UI language code (en, fr, de) */
  language: string;
  /** Logo file for upload (optional) */
  logoFile: File | null;
  /** Temporary object URL for logo preview */
  logoPreview: string | null;
  /** Team member email invitations (optional) */
  teamInvites: TeamInvite[];
}
