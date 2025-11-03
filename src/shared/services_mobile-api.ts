export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function getBaseUrl(): string {
  // Works in RN (Expo) and Node without requiring Node types
  const env = (globalThis as any)?.process?.env || (globalThis as any)?.env || {};
  return env.EXPO_PUBLIC_API_BASE_URL || env.API_BASE_URL || '';
}

export interface AuthHeadersOptions {
  accessToken?: string; // Supabase access token (Bearer)
}

export function buildAuthHeaders(options?: AuthHeadersOptions) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`;
  return headers;
}

export async function apiFetch<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : undefined;
    if (!res.ok) return { ok: false, status: res.status, error: (data as any)?.error || res.statusText };
    return { ok: true, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'Network error' };
  }
}

// Health
export async function getHealth() {
  return apiFetch<{ status: string; message: string }>(`/api/health`, 'GET', undefined, buildAuthHeaders());
}

// Chat
export interface SendChatRequest {
  message: string;
  mode?: 'fast' | 'accurate';
  sessionId?: string;
  conversationId?: string;
}

export async function sendChat(req: SendChatRequest, accessToken?: string) {
  return apiFetch(`/api/chat`, 'POST', req, buildAuthHeaders({ accessToken }));
}

export async function listConversations(accessToken?: string) {
  return apiFetch(`/api/conversations`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function listMessages(conversationId: string, accessToken?: string) {
  const q = new URLSearchParams({ conversationId }).toString();
  return apiFetch(`/api/messages?${q}`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

// Bible
export async function getBibleVersions(accessToken?: string) {
  return apiFetch(`/api/bible/versions`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function getDailyVerse(accessToken?: string) {
  return apiFetch(`/api/bible/daily-verse`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function getPassage(reference: string, version?: string, accessToken?: string) {
  const params = new URLSearchParams({ reference, ...(version ? { version } : {}) }).toString();
  return apiFetch(`/api/bible/passage?${params}`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function getPopularVerses(version?: string, accessToken?: string) {
  const params = version ? new URLSearchParams({ version }).toString() : '';
  const url = params ? `/api/bible/popular?${params}` : '/api/bible/popular';
  return apiFetch(url, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function searchBible(query: string, version?: string, accessToken?: string) {
  const params = new URLSearchParams({ query, ...(version ? { version } : {}) }).toString();
  return apiFetch(`/api/bible/search?${params}`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function crossReferences(reference: string, version?: string, accessToken?: string) {
  const params = new URLSearchParams({ reference, ...(version ? { version } : {}) }).toString();
  return apiFetch(`/api/bible/cross-references?${params}`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

// Notes
export async function listNotes(accessToken?: string) {
  return apiFetch(`/api/bible/notes`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function createNote(body: any, accessToken?: string) {
  return apiFetch(`/api/bible/notes`, 'POST', body, buildAuthHeaders({ accessToken }));
}

export async function updateNote(noteId: string, body: any, accessToken?: string) {
  return apiFetch(`/api/bible/notes/${noteId}`, 'PUT', body, buildAuthHeaders({ accessToken }));
}

export async function noteHistory(accessToken?: string) {
  return apiFetch(`/api/bible/notes/history`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function searchNotes(query: string, accessToken?: string) {
  const params = new URLSearchParams({ q: query }).toString();
  return apiFetch(`/api/bible/notes/search?${params}`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function geocodeAddress(payload: any, accessToken?: string) {
  return apiFetch(`/api/geocode`, 'POST', payload, buildAuthHeaders({ accessToken }));
}

export async function geocodeAutocomplete(params: Record<string, string>, accessToken?: string) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/api/geocode/autocomplete?${q}`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

// Subscriptions
export async function getPlans(accessToken?: string) {
  return apiFetch(`/api/subscriptions/plans`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function createSubscription(body: any, accessToken?: string) {
  return apiFetch(`/api/subscriptions/create`, 'POST', body, buildAuthHeaders({ accessToken }));
}

export async function getSubscriptionStatus(accessToken?: string) {
  return apiFetch(`/api/subscriptions/status`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function getSubscriptionUsage(accessToken?: string) {
  return apiFetch(`/api/subscriptions/usage`, 'GET', undefined, buildAuthHeaders({ accessToken }));
}

export async function cancelSubscription(accessToken?: string) {
  return apiFetch(`/api/subscriptions/cancel`, 'POST', {}, buildAuthHeaders({ accessToken }));
}

export async function reactivateSubscription(accessToken?: string) {
  return apiFetch(`/api/subscriptions/reactivate`, 'POST', {}, buildAuthHeaders({ accessToken }));
}


