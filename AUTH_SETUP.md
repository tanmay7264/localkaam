# Local Kaam authentication setup

The frontend runs in demo mode when the Vite Supabase variables are missing. Real authentication requires a Supabase project and Setu DigiLocker credentials.

## 1. Create Supabase

Create a new Supabase project, then link this repository locally:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

In Supabase Auth:

- Enable Phone provider and configure an SMS provider.
- Enable email confirmations.
- Set the Site URL to `https://tanmay7264.github.io/localkaam/`.
- Add the same URL to the allowed redirect URLs.

The migration creates profiles, marketplace tables, identity-verification tables, RLS policies, and the safe worker directory view.

## 2. Configure the GitHub Pages build

Add these repository Actions secrets under Settings → Secrets and variables → Actions:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_APP_URL=https://tanmay7264.github.io/localkaam/
```

The anon key is safe to expose in a browser only because database access is enforced by RLS. Never put the service-role key or Setu secret in a `VITE_*` variable.

## 3. Configure Setu DigiLocker

Create the Setu DigiLocker product instance and register this callback URL with the provider:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/digilocker-callback
```

Set sandbox secrets first:

```sh
supabase secrets set \
  APP_URL=https://tanmay7264.github.io/localkaam/ \
  SETU_BASE_URL=https://dg-sandbox.setu.co \
  SETU_CLIENT_ID=YOUR_SETU_CLIENT_ID \
  SETU_CLIENT_SECRET=YOUR_SETU_CLIENT_SECRET \
  SETU_PRODUCT_INSTANCE_ID=YOUR_SETU_PRODUCT_INSTANCE_ID
```

Deploy every function:

```sh
supabase functions deploy digilocker-start
supabase functions deploy digilocker-callback --no-verify-jwt
supabase functions deploy verification-status
supabase functions deploy verification-withdraw
supabase functions deploy account-delete
```

`digilocker-callback` is intentionally public because DigiLocker/Setu calls it without the user’s Supabase Authorization header. It is protected by a one-time, hashed state value stored in `identity_verifications`.

After sandbox validation, change `SETU_BASE_URL` to the production endpoint and use the approved production credentials.

## 4. Verify before production

Test:

- Phone OTP and email confirmation.
- DigiLocker consent cancellation and success.
- Invalid or replayed callback state.
- Name mismatch leading to `needs_review`.
- RLS access as worker, employer, and unauthenticated user.
- Employer visibility of only the verification badge.
- Withdrawal and account deletion.

Do not enable production identity verification until the Setu/DigiLocker partner approval and privacy/legal review are complete.
