# Cloudflare Worker deployment

The repository contains a Cloudflare Worker entry point (`worker.ts`) that
serves the calculator's static assets and the same-origin `/api/*` routes.
Those routes reuse the Pages Functions handlers in `functions/`. A Worker
project must deploy `worker.ts`; it will **not** discover Pages Functions
automatically. The Replit Express API and PostgreSQL remain unchanged.

## 1. Select one Worker project

Two existing Cloudflare Workers Builds checks are attached to this GitHub
repository. Pick **one** Worker to host this calculator. The
`wrangler.example.toml` name is set to
`ronnierags-allsearch-executive-compensation-calculator`; if the other Worker
is the intended host, change the name to that Worker's exact name. Disconnect
the unused project's Git build trigger to avoid duplicate deployments.

Cloudflare pulls committed code from GitHub `main`, not uncommitted changes
in Replit. In your chosen Worker project's **Settings → Build**, use:

- Root directory: `artifacts/executive-comp-calculator`
- Build command: `PORT=22712 BASE_PATH=/ pnpm run build`
- Deploy command: `npx wrangler deploy`
- Build variable `PNPM_VERSION`: `10.26.1`
- Build variable `VITE_CLERK_PUBLISHABLE_KEY`: from **your own production**
  Clerk instance, not Replit-managed development Clerk

Keep `VITE_CLERK_PROXY_URL` unset. The default Workers Builds install happens
**before** the build command. If it reports `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`,
confirm that the failing build checked out the latest GitHub `main` commit
and that the selected root directory is correct. Set `PNPM_VERSION` in the
Worker's **build variables** and clear its build cache before retrying.
A fresh clone of the committed source passes a frozen install with pnpm
10.11.1 on Node 24, so do not remove the workspace's security overrides or
disable frozen installs without evidence of the build-environment difference.

## 2. Create D1 and complete the Wrangler config

Create a Cloudflare D1 database and apply `migrations/0001_leads.sql` through
its D1 console before accepting real submissions. Copy
`wrangler.example.toml` to `wrangler.toml`, set `database_id` to the **real D1
database ID** (not a secret), set `database_name` to your database name, and
commit and push that file. Workers Builds uses it to bind D1 as `DB` and to
upload `dist/public` as static assets with SPA routing. Do not deploy the
example file with its placeholder ID.

In the Worker project's **Settings → Variables and Secrets**, add these
**runtime** values for the chosen Worker:

| Name | Source |
| --- | --- |
| `CLERK_SECRET_KEY` | Secret key from your own production Clerk instance; store as a secret |
| `ADMIN_EMAIL` | Email of the Clerk user allowed to view/export leads |
| `RESEND_API_KEY` | Resend API key; store as a secret |
| `EMAIL_FROM` | Sender on a verified Resend domain, e.g. `plans@domainexecutivecompensation.download` |
| `LEAD_NOTIFICATION_EMAIL` | Internal address to receive a BCC copy |

The Wrangler config enables `nodejs_compat`. In your own Clerk account,
allow the Worker's domain and eventual custom domain as application
origins/redirect URLs. The build-time publishable key and runtime secret key
must be from the **same production Clerk instance**. The admin API verifies a
Clerk session token and checks the server-side `ADMIN_EMAIL`.

## 3. Check before switching your domain

1. Open the Worker's public URL. `/api/healthz` should return
   `{"status":"ok"}` and `/admin` should render the sign-in page.
2. Submit a sample plan. A PDF should download and a row should appear in D1.
3. Sign in as `ADMIN_EMAIL`, check `/admin` and its CSV export; verify that
   unauthenticated requests to `/api/admin/leads` return 401.
4. Verify your sending domain in Resend and repeat the submission to confirm
   delivery. Without a verified domain the PDF still downloads, but email
   is **not** sent.
5. Only after these checks, attach the website custom domain to the chosen
   Worker. The email sending domain is separate from the website domain.

The Replit development and production lead tables were empty when this
Cloudflare version was prepared. D1 does not automatically copy any leads
added to Replit later; export/import those records before cutover if needed.