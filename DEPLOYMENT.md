# Deploying MiSlice to Vercel (production)

The frontend is a Vite SPA; the one server route (`/api/parse-pizza`) is a Vercel
serverless function. Firebase (Auth + Firestore `pizza` database) is the backend.

## 1. Deploy

From this project folder:

```bash
vercel login          # opens browser, one-time
vercel                # first deploy → answer prompts (creates a Preview)
vercel --prod         # promote to production
```

Defaults are correct (configured in `vercel.json`):
- Build command: `vite build`
- Output directory: `dist`
- SPA rewrites for client-side routing; `/api/*` served as functions

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | optional | Enables AI smart-search parsing. Without it, search uses a safe mock. Set for **Production**. |

The Firebase **web** config (`firebase-applet-config.json`) is shipped in the client
bundle — that's expected; web API keys are public identifiers, not secrets. Access is
controlled by Firestore security rules, not by hiding the key.

After setting env vars, redeploy: `vercel --prod`.

## 3. CRITICAL — authorize the Vercel domain in Firebase

Firebase Auth rejects sign-in from unknown domains. After the first deploy you'll get a
URL like `mislice-xxxx.vercel.app`. Add it (and any custom domain) here:

**Firebase Console → Authentication → Settings → Authorized domains → Add domain**
https://console.firebase.google.com/u/0/project/mislice-364af/authentication/settings

- Email/Password login works without this, but **Google sign-in will fail** until the
  domain is authorized.

## 4. Verify in production

1. Open the production URL.
2. Sign up as a customer (or Google) and as a store owner — confirm both routes.
3. Check the new `users/{uid}` docs appear in the Firestore `pizza` database.
4. Open the Deals page — it reads live from Firestore.

## 5. Custom domain — mislice.online (registered at Hostinger)

Architecture: **Vercel** hosts the frontend + API functions, **Firebase** stays the
backend/DB, and the Hostinger-registered domain points to Vercel via DNS records.
Do **not** host the app on Hostinger shared hosting — it can't run the `/api/*`
serverless functions.

> ⚠️ This domain also has **Hostinger business email** active. Only edit DNS
> **records** (A / CNAME) — do **not** change the nameservers and keep the **MX**
> records, or email will break.

1. **Vercel** → Project → Settings → **Domains** → add `mislice.online` and
   `www.mislice.online`. Vercel shows the exact records to create.
2. **Hostinger** hPanel → Domains → mislice.online → **DNS / Manage DNS records**:
   - Delete the existing apex `@` **A** records pointing to Hostinger
     (e.g. `147.79.79.7`, `88.223.87.78`) and the **AAAA** (`2a02:…`) records.
   - Add **A**: `@` → `76.76.21.21`
   - Add **CNAME**: `www` → `cname.vercel-dns.com`
   - Keep all **MX** records (email) untouched.
3. **Firebase** → Authentication → Settings → **Authorized domains** → add
   `mislice.online` and `www.mislice.online` (required for Google/login).
4. Wait for DNS propagation; Vercel auto-provisions HTTPS. Verify at
   `https://mislice.online`.

Nothing in the codebase changes for the custom domain — Firebase is reached via the
client SDK regardless of the hosting origin.

## Production-readiness notes

- ✅ Auth (email/password + Google), store/deal browsing, store provisioning, security
  rules — all backed by Firebase.
- ⚠️ Cart, checkout, order history and saved pizzas currently persist in the browser
  (`localStorage`), not Firestore — they work per-device but aren't synced/server-persisted yet.
- ⚠️ Payments are not implemented.
- Firebase is on the **Spark (free)** plan; fine for early real-world usage within free
  quotas. Upgrade to **Blaze** before heavy traffic or to use Cloud Functions.
