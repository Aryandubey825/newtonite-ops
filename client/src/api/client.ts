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

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
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
  }

  return response.json();
}
