import { apiRequest, type ApiResponse } from './client';

export interface LawSearchResult {
  lawId: string;
  lawName: string;
  articleNo: string;
  articleTitle: string;
  content: string;
  enforcementDate: string;
  similarity: number;
}

export async function searchLaw(
  token: string,
  query: string,
  limit = 5,
): Promise<ApiResponse<LawSearchResult[]>> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return apiRequest<LawSearchResult[]>(`/api/law/search?${params.toString()}`, { token });
}
