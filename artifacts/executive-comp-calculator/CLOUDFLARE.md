# Cloudflare Pages deployment

The Pages project serves the calculator and its `/api/*` Pages Functions on the
same origin. It does **not** use the Replit Express API or PostgreSQL. Do not
turn off the Replit app until this deployment has been checked end to end.

## 1. Connect the source

In Cloudflare **Workers & Pages → Create → Pages → Connect to Git**, select
`ronnierags/ronnierags-allsearch-executive-compensation-calculator` and the
`main` branch. Cloudflare pulls committed code from GitHub, not unsaved Replit
workspace changes. Commit and push changes from Replit's Git panel first.

Set the Pages project's **root directory** to
`artifacts/executive-comp-calculator`. Use:

- Build command: `PORT=22712 BASE_PATH=/ pnpm run build`
- Build output directory: `dist/public`
- Environment variable `PNPM_VERSION`: `10.26.1`
- Build-time variable `VITE_CLERK_PUBLISHABLE_KEY`: your **own production**
  Clerk publishable key (not a Replit-managed development key)

Keep `VITE_CLERK_PROXY_URL` unset. If an earlier deployment failed during
dependency installation, retry with the build cache cleared. Do not disable
the frozen lockfile check; the repository includes its updated pnpm lockfile.

## 2. Configure the API and database

Create a Cloudflare **D1 database** for this project. In the Pages project's
**Settings → Bindings**, add a **D1 database** binding named exactly `DB`,
pointing at that database. Apply `migrations/0001_leads.sql` to the database
using its Cloudflare D1 console **before accepting real submissions**. Configure
the same binding for Preview if you intend to test preview deployments.

In the Pages project's **Settings → Variables and Secrets**, configure these
runtime values for Production (and Preview if used):

| Name | Source |
| --- | --- |
| `CLERK_SECRET_KEY` | Secret key from **your own** production Clerk instance; store as a secret |
| `ADMIN_EMAIL` | Email address of the Clerk user allowed to view/export leads |
| `RESEND_API_KEY` | Resend API key; store as a secret |
| `EMAIL_FROM` | A sender on your verified Resend domain, such as `plans@domainexecutivecompensation.download` |
| `LEAD_NOTIFICATION_EMAIL` | Internal address to receive a BCC copy |

Set the **Compatibility date** to `2026-09-01` or later and enable the
`nodejs_compat` compatibility flag in **Settings → Functions** for Production
and Preview. Redeploy after changing bindings, variables, or flags.

In your own Clerk account, allow the Pages domain and eventual custom domain
as application origins/redirect URLs. The website's Clerk publishable key and
the Function's Clerk secret key must be from the **same production instance**.
The `/admin` and `/sign-in` routes are part of the website. The admin API also
verifies the Clerk session token and restricts access to `ADMIN_EMAIL` on the
server; a signed-in non-admin cannot retrieve the lead list or CSV.

## 3. Check before pointing a custom domain at Pages

1. Open the Pages `*.pages.dev` URL and check `/api/healthz` returns
   `{"status":"ok"}`.
2. Submit a sample plan. The browser should download a PDF even if email
   delivery has not yet been enabled.
3. Check that a row appears in D1 and, after signing into your own Clerk
   account as `ADMIN_EMAIL`, appears under `/admin`. Check the CSV export.
4. Verify the sending domain in Resend and repeat the submission to confirm
   email delivery. An unverified domain returns a downloaded PDF but does
   **not** send email.
5. Only then attach your desired website custom domain in Cloudflare Pages.
   The email sending domain is separate from the website domain.

The current Replit development and production lead tables were empty when
this Cloudflare version was prepared. A new D1 database does not automatically
copy any leads added to Replit later. If you start accepting leads on Replit
before switching traffic, export and import those records before cutover.