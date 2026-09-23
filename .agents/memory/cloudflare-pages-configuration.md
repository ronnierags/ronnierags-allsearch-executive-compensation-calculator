---
name: Cloudflare Pages configuration
description: Why this project's Pages deployment is configured through the dashboard rather than a checked-in Wrangler production config.
---

Keep the Pages project's D1 binding, secrets, and compatibility settings in the Cloudflare dashboard until its real database and project identifiers are available; do not commit a production Wrangler file with placeholder IDs.

**Why:** Cloudflare treats a Wrangler file containing `pages_build_output_dir` as the source of truth for Pages deployments. A partial file that only names the output and compatibility settings can override dashboard bindings, leaving the deployed API without its D1 database.

**How to apply:** When the owner provides a connected Cloudflare project and D1 identifiers, either keep dashboard-only configuration or deliberately migrate the full configuration to Wrangler. Check that production and preview bindings survive the change before switching traffic.

Cloudflare has reported a frozen-install `overrides` mismatch even though a fresh GitHub `main` clone completed the same frozen install with pnpm 10.11.1 on Node 24. Treat the failing build's checkout commit and effective build environment as unverified until inspected; regenerating the lockfile locally is not evidence of a fix.

**Why:** Both local workspace and clean GitHub checkout passed with Cloudflare's reported pnpm version, so an override change in source is not established as the cause.

**How to apply:** Check the build's exact commit, project type and root directory first; then pin the intended pnpm version and clear the Cloudflare build cache before attempting changes to security or platform overrides.