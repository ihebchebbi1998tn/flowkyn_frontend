/**
 * @fileoverview Contact API Module
 *
 * Public contact form submission — no authentication required.
 * Submissions are stored in the database and can be managed
 * via the admin panel at admin.flowkyn.com.
 *
 * @see NodejsBackend/src/routes/contact.routes.ts
 */

import { api } from './client';

/** Contact form submission shape */
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  ipAddress?: string;
  createdAt: string;
}

export const contactApi = {
  /** Submit a contact form (public, no auth required) */
  submit: (data: { name: string; email: string; subject?: string; message: string }) =>
    api.post<{ message: string; id: string }>('/contact', data),
};
