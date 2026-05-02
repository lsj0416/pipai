import { apiRequest, type ApiResponse } from './client';

export type TargetChannel = 'law_interpretation' | 'tech_support' | 'self_diagnosis';

export interface InquiryGenerateRequest {
  conversationId: string;
  targetChannel: TargetChannel;
}

export interface InquiryData {
  inquiryId: string;
  title: string;
  body: string;
  targetChannel: TargetChannel;
  targetUrl: string;
  createdAt: string;
}

export async function generateInquiry(
  token: string,
  body: InquiryGenerateRequest,
): Promise<ApiResponse<InquiryData>> {
  return apiRequest<InquiryData>('/api/inquiry/generate', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export async function getInquiry(
  token: string,
  inquiryId: string,
): Promise<ApiResponse<InquiryData>> {
  return apiRequest<InquiryData>(`/api/inquiry/${inquiryId}`, { token });
}
