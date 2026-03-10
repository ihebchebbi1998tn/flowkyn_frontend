import type { ErrorCode } from './errorCodes';

/** Structured API error matching the backend ErrorResponse shape */
export interface ApiErrorResponse {
  error: string;
  code: ErrorCode;
  statusCode: number;
  requestId: string;
  details?: { field: string; message: string }[];
  timestamp: string;
}

export class ApiError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public requestId: string;
  public details?: { field: string; message: string }[];

  constructor(response: ApiErrorResponse) {
    super(response.error);
    this.name = 'ApiError';
    this.code = response.code;
    this.statusCode = response.statusCode;
    this.requestId = response.requestId;
    this.details = response.details;
  }

  /** Check if an unknown error is an ApiError */
  static is(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }
}
