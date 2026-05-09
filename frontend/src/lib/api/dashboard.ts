import { apiRequest, type ApiResponse } from './client';

// ── 백엔드 응답 타입 ──────────────────────────────────────────────────────────
export type RiskLevel = 'IMMEDIATE' | 'CHECK_NEEDED' | 'GOOD';

export interface BackendRiskItem {
  id: string;
  title: string;
  description: string | null;
  level: RiskLevel;
  relatedLaw: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSummary {
  riskCounts: Record<string, number>;
  recentItems: BackendRiskItem[];
}

// ── API 함수 ──────────────────────────────────────────────────────────────────
export async function getSummary(token: string): Promise<ApiResponse<BackendSummary>> {
  return apiRequest<BackendSummary>('/api/dashboard/summary', { token });
}

export async function getRisks(token: string): Promise<ApiResponse<BackendRiskItem[]>> {
  return apiRequest<BackendRiskItem[]>('/api/dashboard/risks', { token });
}

export async function resolveRisk(
  token: string,
  id: string,
): Promise<ApiResponse<BackendRiskItem>> {
  return apiRequest<BackendRiskItem>(`/api/dashboard/risks/${id}/resolve`, {
    method: 'PATCH',
    token,
  });
}
