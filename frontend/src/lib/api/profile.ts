import { apiRequest, type ApiResponse } from './client';

export interface GrowthPlan {
  targetEmployeeCount: number;
  targetRevenue: number;
  plannedExpansion: string;
}

export interface Profile {
  profileId: string;
  businessType: string;
  employeeCount: number;
  annualRevenue: number;
  personalDataItems: string[];
  subcontractorCount: number;
  growthPlan: GrowthPlan;
  createdAt: string;
  updatedAt: string;
}

export type ProfileUpsertRequest = Omit<Profile, 'profileId' | 'createdAt' | 'updatedAt'>;

export async function getProfile(token: string): Promise<ApiResponse<Profile>> {
  return apiRequest<Profile>('/api/profile', { token });
}

export async function upsertProfile(
  token: string,
  body: ProfileUpsertRequest,
): Promise<ApiResponse<Profile>> {
  return apiRequest<Profile>('/api/profile', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}
