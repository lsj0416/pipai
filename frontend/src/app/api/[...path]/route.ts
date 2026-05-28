import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const backendPath = `/api/${path.join('/')}`;
  const backendUrl = `${BACKEND_URL}${backendPath}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.blob()
      : undefined;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body,
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
