/**
 * @fileoverview Shared TypeScript interfaces for the Flowkyn API test runner.
 */

// ─── Test Lifecycle ──────────────────────────────────────────────────────────

/** Possible statuses for a test during its lifecycle */
export type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'skipped';

// ─── Request Metadata ────────────────────────────────────────────────────────

/**
 * Captures full details of an HTTP request made during a test.
 */
export interface RequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  curl: string;
}

// ─── Test Case Definition ────────────────────────────────────────────────────

export interface TestCase {
  id: string;
  name: string;
  method: string;
  endpoint: string;
  requiresAuth: boolean;
  category: string;
  run: (ctx: TestContext) => Promise<TestResult>;
}

// ─── Test Result ─────────────────────────────────────────────────────────────

/**
 * The outcome of running a single test case.
 * Enhanced with diagnostics and response headers for maximum debugging info.
 */
export interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  statusCode?: number;
  response?: unknown;
  error?: string;
  assertions?: string[];
  requests?: RequestInfo[];
  /** Response headers captured from the primary API call */
  responseHeaders?: Record<string, string>;
  /** Auto-generated diagnostic metadata for debugging */
  diagnostics?: Record<string, unknown>;
  /** Why this test was skipped (human-readable) */
  skipReason?: string;
}

// ─── Test State (UI) ─────────────────────────────────────────────────────────

export interface TestState {
  status: TestStatus;
  result?: TestResult;
}

// ─── Shared Execution Context ────────────────────────────────────────────────

export interface TestContext {
  baseUrl: string;
  token: string | null;
  refreshToken: string | null;
  setToken: (t: string) => void;
  setRefreshToken: (t: string) => void;
  createdIds: Record<string, string>;
}
