import { api } from '@/features/app/api/client';

export interface EarlyAccessPayload {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
}

export const earlyAccessApi = {
  submit: (data: EarlyAccessPayload) =>
    api.post<{ message: string; id: string }>('/early-access', data),
};

