export class ApiError extends Error {
  public status: number;
  public details?: any;
  public code?: string;

  constructor(status: number, message: string, details?: any, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

let authToken: string | null = localStorage.getItem('newtonite_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('newtonite_token', token);
  } else {
    localStorage.removeItem('newtonite_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');

import { handleDemoRequest } from './demoStore';

let isDemoModeActive = false;

export function isDemoMode(): boolean {
  return isDemoModeActive;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (['POST', 'PATCH', 'PUT'].includes((options.method || 'GET').toUpperCase())) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    // Automatically generate Idempotency-Key if not explicitly provided
    if (!headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', crypto.randomUUID());
    }
  }

  // If already identified as demo mode (e.g. on Vercel preview), serve directly from demoStore
  if (isDemoModeActive) {
    return handleDemoRequest<T>(endpoint, options);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.ok) {
      return response.json();
    }

    // If 404/405 or HTML returned (Vercel static host with no backend), switch to demo store!
    const contentType = response.headers.get('content-type') || '';
    if (response.status === 404 || response.status === 405 || contentType.includes('text/html')) {
      console.warn(`[Newtonite API] Endpoint ${endpoint} returned ${response.status}. Switching to Smart Demo Store for Vercel preview.`);
      isDemoModeActive = true;
      return handleDemoRequest<T>(endpoint, options);
    }

    let errData: any = {};
    try {
      errData = await response.json();
    } catch {
      errData = { message: response.statusText };
    }

    throw new ApiError(
      response.status,
      errData.message || 'An error occurred during request',
      errData.details,
      errData.error
    );
  } catch (err: any) {
    // If fetch failed due to network error / unreachable host (e.g. on Vercel preview without cloud backend)
    if (err instanceof ApiError) {
      throw err;
    }
    console.warn(`[Newtonite API] Network unreachable for ${endpoint} (${err.message}). Activating Smart Demo Store for Vercel preview.`);
    isDemoModeActive = true;
    return handleDemoRequest<T>(endpoint, options);
  }
}
