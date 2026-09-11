import { adminClient, corsHeaders, json, randomToken, requireUser, setuBaseUrl, setuHeaders, sha256 } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(request);
    const admin = adminClient();
    const state = randomToken();
    const stateHash = await sha256(state);
    const callback = `${Deno.env.get('SUPABASE_URL')}/functions/v1/digilocker-callback?state=${encodeURIComponent(state)}`;
    const verification = await admin.from('identity_verifications').insert({
      user_id: user.id,
      provider: 'setu_digilocker',
      state_hash: stateHash,
      status: 'pending',
    }).select('id').single();
    if (verification.error) throw verification.error;

    const response = await fetch(`${setuBaseUrl()}/api/digilocker/`, {
      method: 'POST',
      headers: setuHeaders(),
      body: JSON.stringify({ redirectUrl: callback }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.id || !payload.url) {
      await admin.from('identity_verifications').update({ status: 'rejected' }).eq('id', verification.data.id);
      throw new Error(payload?.error?.detail || 'Unable to start DigiLocker verification.');
    }
    await admin.from('identity_verifications').update({ provider_request_id: payload.id, expires_at: payload.validUpto || null }).eq('id', verification.data.id);
    await admin.from('verification_events').insert({ user_id: user.id, verification_id: verification.data.id, event_type: 'started', provider_status: payload.status, metadata: {} });
    return json({ id: verification.data.id, url: payload.url, expiresAt: payload.validUpto });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to start verification.' }, 400);
  }
});
