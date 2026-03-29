/**
 * Coffee Roulette shared constants
 * Single source of truth for default values used across frontend components and referenced by the backend.
 */

/** Default chat duration in minutes when no event setting overrides it. */
export const DEFAULT_COFFEE_CHAT_DURATION_MINUTES = 30;

/** Maximum number of prompts before a "continue or end?" decision is required. */
export const DEFAULT_MAX_PROMPTS = 6;

/** Timer warning threshold in seconds (shows red timer when < this value). */
export const TIMER_WARNING_SECONDS = 300;
