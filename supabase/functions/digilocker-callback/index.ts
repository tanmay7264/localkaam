import { adminClient, redirectToApp, setuBaseUrl, setuHeaders, sha256, normalizeName } from '../_shared/http.ts';

function addressForStorage(address: Record<string, unknown> | undefined) {
  if (!address) return null;
  return {
    country: address.country || null,
    state: address.state || null,
    district: address.district || null,
    pin: address.pin || null,
  };
}

Deno.serve(async (request) => {
  const params = new URL(request.url).searchParams;
  const state = params.get('state');
  const providerRequestId = params.get('id');
  const success = ['true', '1', 'yes'].includes((params.get('success') || '').toLowerCase());
  if (!state || !providerRequestId) return redirectToApp({ verification: 'failed', reason: 'invalid_callback' });

  const admin = adminClient();
  const stateHash = await sha256(state);
  const { data: verification } = await admin.from('identity_verifications').select('id,user_id,status,provider_request_id').eq('state_hash', stateHash).maybeSingle();
  if (!verification || (verification.provider_request_id && verification.provider_request_id !== providerRequestId)) {
    return redirectToApp({ verification: 'failed', reason: 'invalid_callback' });
  }
  if (verification.status !== 'pending') return redirectToApp({ verification: verification.status });

  if (!success || !(params.get('scope') || '').split(/[+ ]/).includes('ADHAR')) {
    await admin.from('identity_verifications').update({ status: 'rejected', provider_request_id: providerRequestId, completed_at: new Date().toISOString() }).eq('id', verification.id);
    await admin.from('verification_events').insert({ user_id: verification.user_id, verification_id: verification.id, event_type: 'consent_failed', provider_status: params.get('scope'), error_code: params.get('errCode'), metadata: {} });
    return redirectToApp({ verification: 'failed', reason: 'consent_not_granted' });
  }

  try {
    const response = await fetch(`${setuBaseUrl()}/api/digilocker/${encodeURIComponent(providerRequestId)}/aadhaar`, { headers: setuHeaders() });
    const payload = await response.json();
    const aadhaar = payload?.aadhaar;
    if (!response.ok || payload.status !== 'complete' || !aadhaar?.name || aadhaar?.verified?.signature !== true) throw new Error('The DigiLocker identity response could not be validated.');

    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', verification.user_id).single();
    const verifiedName = String(aadhaar.name);
    const nameMatches = normalizeName(String(profile?.display_name || '')) === normalizeName(verifiedName);
    const canonical = JSON.stringify({ name: verifiedName, dateOfBirth: aadhaar.dateOfBirth || null, maskedNumber: aadhaar.maskedNumber || null, address: addressForStorage(aadhaar.address) });
    const documentHash = await sha256(canonical);
    const status = nameMatches ? 'verified' : 'needs_review';
    await admin.from('identity_verifications').update({
      status,
      provider_request_id: providerRequestId,
      verified_name: verifiedName,
      verified_date_of_birth: aadhaar.dateOfBirth || null,
      verified_address: addressForStorage(aadhaar.address),
      document_hash: documentHash,
      provider_transaction_id: params.get('traceId'),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
    }).eq('id', verification.id);
    await admin.from('profiles').update({ verification_status: status, verification_expires_at: status === 'verified' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null }).eq('id', verification.user_id);
    await admin.from('consents').insert({ user_id: verification.user_id, purpose: 'identity_verification', scope: ['ADHAR'], notice_version: 'v1' });
    await admin.from('verification_events').insert({ user_id: verification.user_id, verification_id: verification.id, event_type: status, provider_status: payload.status, metadata: { signatureVerified: true, nameMatched: nameMatches } });
    await fetch(`${setuBaseUrl()}/api/digilocker/${encodeURIComponent(providerRequestId)}/revoke`, { headers: setuHeaders() }).catch(() => undefined);
    return redirectToApp({ verification: status });
  } catch (error) {
    await admin.from('identity_verifications').update({ status: 'needs_review', provider_request_id: providerRequestId, completed_at: new Date().toISOString() }).eq('id', verification.id);
    await admin.from('verification_events').insert({ user_id: verification.user_id, verification_id: verification.id, event_type: 'processing_failed', error_code: error instanceof Error ? error.message : 'unknown_error', metadata: {} });
    return redirectToApp({ verification: 'needs_review' });
  }
});
