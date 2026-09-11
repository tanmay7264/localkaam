import { adminClient, corsHeaders, json, requireUser } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(request);
    const admin = adminClient();
    const [profile, verification] = await Promise.all([
      admin.from('profiles').select('verification_status').eq('id', user.id).single(),
      admin.from('identity_verifications').select('id,status,verified_name,verified_date_of_birth,expires_at,created_at,completed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (profile.error) throw profile.error;
    return json({ status: profile.data.verification_status, verification: verification.data || null });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to read verification status.' }, 400);
  }
});
