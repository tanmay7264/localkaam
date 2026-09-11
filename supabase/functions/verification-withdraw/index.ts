import { adminClient, corsHeaders, json, requireUser, setuBaseUrl, setuHeaders } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(request);
    const admin = adminClient();
    const { data: latest } = await admin.from('identity_verifications').select('id,provider_request_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (latest?.provider_request_id) await fetch(`${setuBaseUrl()}/api/digilocker/${encodeURIComponent(latest.provider_request_id)}/revoke`, { headers: setuHeaders() }).catch(() => undefined);
    await admin.from('profiles').update({ verification_status: 'unverified', verification_expires_at: null }).eq('id', user.id);
    await admin.from('consents').update({ withdrawn_at: new Date().toISOString() }).eq('user_id', user.id).is('withdrawn_at', null);
    if (latest) await admin.from('identity_verifications').update({ status: 'expired', completed_at: new Date().toISOString() }).eq('id', latest.id);
    await admin.from('verification_events').insert({ user_id: user.id, verification_id: latest?.id || null, event_type: 'consent_withdrawn', metadata: {} });
    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to withdraw verification.' }, 400);
  }
});
