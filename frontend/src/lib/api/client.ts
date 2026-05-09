// Base API client — fetch wrapper with header management and error parsing

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');

  const resolved = token ?? getToken();
  if (resolved) {
    headers.set('Authorization', `Bearer ${resolved}`);
  }

  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...fetchOptions,
    headers,
  });

  // Spring Security 기본 설정이 미인증 시 403을 반환하므로 401과 동일하게 처리
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    return {
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다. 다시 로그인해 주세요.' },
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>;
  }

  try {
    const json = (await response.json()) as ApiResponse<T>;
    return json;
  } catch {
    return {
      success: false,
      data: null,
      error: { code: 'PARSE_ERROR', message: '응답을 처리할 수 없습니다.' },
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>;
  }
}
