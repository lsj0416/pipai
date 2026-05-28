import { apiRequest, type ApiResponse } from './client';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  title?: string;
  contactPhone: string;
  termsService: boolean;
  termsPrivacy: boolean;
  termsMarketing: boolean;
  termsAiUsage: boolean;
}

export interface SignupResponse {
  userId: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export async function signup(body: SignupRequest): Promise<ApiResponse<SignupResponse>> {
  return apiRequest<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function login(body: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function refresh(body: RefreshRequest): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const userId: string | undefined = payload.sub ?? payload.userId ?? payload.id;
        if (userId) localStorage.removeItem(`pipai_mypage_form_${userId}`);
      } catch {}
    }
    localStorage.removeItem('accessToken');
  }
  await fetch('/api/auth/token', { method: 'DELETE' });
}
