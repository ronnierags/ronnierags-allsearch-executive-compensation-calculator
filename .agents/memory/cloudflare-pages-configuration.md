---
name: Cloudflare Pages configuration
description: Why this project's Pages deployment is configured through the dashboard rather than a checked-in Wrangler production config.
---

Keep the Pages project's D1 binding, secrets, and compatibility settings in the Cloudflare dashboard until its real database and project identifiers are available; do not commit a production Wrangler file with placeholder IDs.

**Why:** Cloudflare treats a Wrangler file containing `pages_build_output_dir` as the source of truth for Pages deployments. A partial file that only names the output and compatibility settings can override dashboard bindings, leaving the deployed API without its D1 database.

**How to apply:** When the owner provides a connected Cloudflare project and D1 identifiers, either keep dashboard-only configuration or deliberately migrate the full configuration to Wrangler. Check that production and preview bindings survive the change before switching traffic.