import { apiRequest, type ApiResponse } from './client';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
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
