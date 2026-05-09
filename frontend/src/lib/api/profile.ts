import { apiRequest, type ApiResponse } from './client';

export interface Profile {
  id: string;
  businessType: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  personalDataItems: string | null;
  hasPrivacyPolicy: boolean | null;
  sensitiveDataTypes: string | null;
  updatedAt: string;
}

export interface ProfileUpsertRequest {
  businessType: string;
  employeeCount: number | null;
  annualRevenue: string;
  personalDataItems: string;
  hasPrivacyPolicy: boolean;
  sensitiveDataTypes: string;
}

export async function getProfile(token: string): Promise<ApiResponse<Profile>> {
  return apiRequest<Profile>('/api/profile', { token });
}

export async function upsertProfile(
  token: string,
  body: ProfileUpsertRequest,
): Promise<ApiResponse<Profile>> {
  return apiRequest<Profile>('/api/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
}
