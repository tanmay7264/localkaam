import { adminClient, corsHeaders, json, requireUser } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(request);
    const { error } = await adminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;
    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unable to delete the account.' }, 400);
  }
});
