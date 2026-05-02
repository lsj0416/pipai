import { apiRequest, type ApiResponse } from './client';

export type RiskStatus = 'danger' | 'warning' | 'safe' | 'pending';

export interface RiskItem {
  itemId: string;
  title: string;
  status: RiskStatus;
  relatedArticle: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface GrowthScenarioItem {
  trigger: string;
  items: {
    itemId: string;
    title: string;
    relatedArticle: string;
    status: RiskStatus;
  }[];
}

export interface DashboardData {
  summary: { danger: number; warning: number; safe: number };
  currentRisks: RiskItem[];
  growthScenarios: GrowthScenarioItem[];
}

export async function getDashboard(token: string): Promise<ApiResponse<DashboardData>> {
  return apiRequest<DashboardData>('/api/dashboard', { token });
}

export async function patchRiskItem(
  token: string,
  itemId: string,
  status: RiskStatus,
): Promise<ApiResponse<RiskItem>> {
  return apiRequest<RiskItem>(`/api/dashboard/risks/${itemId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}
