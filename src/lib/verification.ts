import { supabase } from './supabase';

export async function startDigiLockerVerification() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('digilocker-start', {
    body: { purpose: 'identity_verification' },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('DigiLocker did not return an authorization URL.');
  window.location.assign(data.url);
}

export async function withdrawVerification() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.functions.invoke('verification-withdraw', { body: {} });
  if (error) throw error;
}
