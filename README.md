# Local Kaam

Mobile-first job marketplace prototype for local hiring in India. Workers search and apply for nearby jobs; employers manage applicants through a connected hiring journey (review → shortlist → chat → interview → verification → decision → onboarding).

**Live (GitHub Pages):** https://tanmay7264.github.io/localkaam/

**Repository:** https://github.com/tanmay7264/localkaam

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- Lucide icons
- Optional Supabase (auth, DB, DigiLocker edge functions)

Without Supabase env vars, the app runs in **demo mode** with local seed data.

## Ports & URLs

| Environment | Command | Port | URL |
| --- | --- | --- | --- |
| Dev server | `npm run dev` | **5173** | http://localhost:5173/localkaam/ |
| Production preview | `npm run preview` | **4173** | http://localhost:4173/localkaam/ |
| GitHub Pages | (CI build) | HTTPS | https://tanmay7264.github.io/localkaam/ |

Notes:

- Vite’s `base` is `/localkaam/` (see `vite.config.ts`). Always open the app with that path, not the site root.
- DigiLocker callbacks default to `http://localhost:5173` when `APP_URL` is unset (see `supabase/functions/_shared/http.ts`).
- Prefer `VITE_APP_URL` / `APP_URL` set to the URL you actually use (local or Pages).

## Quick start

```sh
npm install
npm run dev
```

Open **http://localhost:5173/localkaam/**

```sh
npm run build
npm run preview   # http://localhost:4173/localkaam/
```

```sh
npm run typecheck
npm run lint
```

## Demo hiring journey (worker)

1. Search job → view → apply  
2. Application under review → shortlisted  
3. Chat with employee → arrange interview  
4. Interview scheduled → interview completed  
5. Third-party verification → verification completed  
6. Final decision → selected → onboarding  

Job details is the hub: chat, scheduling, and verification return there so the timeline stays continuous. Employer/recruiter screens mirror the same stages with actions (shortlist, chat, arrange interview, verification, decision).

## Environment

Copy `.env.example` to `.env` for real backend mode:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://tanmay7264.github.io/localkaam/
```

For local DigiLocker testing, set:

```env
VITE_APP_URL=http://localhost:5173/localkaam/
```

Full auth / DigiLocker / Secrets setup: see [AUTH_SETUP.md](./AUTH_SETUP.md).

## Project layout

```text
src/
  screens/     Worker, Employer, Chat, Interview, Hiring verification, Onboarding
  components/  UI + HiringJourney progress
  lib/         hiring helpers, supabase, verification
  store.tsx    Demo + Supabase state
supabase/
  migrations/  Schema + hiring pipeline status
  functions/   DigiLocker and account edge functions
```

## License

Private prototype unless otherwise noted.
