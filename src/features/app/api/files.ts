/**
 * @fileoverview Files API Module
 *
 * File upload and management:
 * - Upload files via multipart/form-data
 * - List the authenticated user's uploaded files (paginated)
 *
 * Uploaded files are stored on the server's filesystem (configurable).
 *
 * @see NodejsBackend/src/routes/files.routes.ts
 */

import { api } from './client';
import type { PaginatedResponse } from '@/types';

/** A user-uploaded file record */
export interface UserFile {
  id: string;
  user_id: string;
  file_type: string;
  original_name: string;
  url: string;
  size: number;
  created_at: string;
}

export const filesApi = {
  /** Upload a file (multipart/form-data) */
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<{ id: string; url: string; file_type: string; size: number }>('/files', formData);
  },

  /** List the current user's uploaded files (paginated) */
  listMyFiles: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<UserFile>>('/files/me', { page: String(page), limit: String(limit) }),
};
