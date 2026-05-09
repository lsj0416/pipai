import { apiRequest, type ApiResponse } from './client';

// ── 백엔드 응답 타입 ──────────────────────────────────────────────────────────
export type InquiryStatus = 'DRAFT' | 'SUBMITTED';

export interface BackendInquiryDraft {
  id: string;
  subject: string;
  content: string;
  relatedLaws: string | null;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

// ── API 함수 ──────────────────────────────────────────────────────────────────
export async function generateInquiry(
  token: string,
  conversationId: string,
): Promise<ApiResponse<BackendInquiryDraft>> {
  return apiRequest<BackendInquiryDraft>(
    `/api/inquiry/generate/${conversationId}`,
    { method: 'POST', token },
  );
}
