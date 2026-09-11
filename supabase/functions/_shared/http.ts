import { createClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';

const appOrigin = (() => {
  try {
    return new URL(Deno.env.get('APP_URL') || 'http://localhost').origin;
  } catch {
    return '*';
  }
})();

export const corsHeaders = {
  'Access-Control-Allow-Origin': appOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export function redirectToApp(params: Record<string, string>) {
  const url = new URL(Deno.env.get('APP_URL') || 'http://localhost:5173');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return Response.redirect(url.toString(), 303);
}

export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function requireUser(request: Request): Promise<User> {
  const authorization = request.headers.get('Authorization');
  if (!authorization) throw new Error('Missing authorization header.');
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Unauthorized.');
  return data.user;
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function setuBaseUrl() {
  return (Deno.env.get('SETU_BASE_URL') || 'https://dg-sandbox.setu.co').replace(/\/$/, '');
}

export function setuHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-client-id': Deno.env.get('SETU_CLIENT_ID') || '',
    'x-client-secret': Deno.env.get('SETU_CLIENT_SECRET') || '',
    'x-product-instance-id': Deno.env.get('SETU_PRODUCT_INSTANCE_ID') || '',
  };
}

export function normalizeName(value: string) {
  return value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
