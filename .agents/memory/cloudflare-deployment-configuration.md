---
name: Cloudflare deployment configuration
description: Deployment decisions and non-reproducible build errors for the calculator's Cloudflare Worker.
---

The existing Git-connected Cloudflare projects are Workers Builds, not Pages. A Pages Functions directory alone is not an entry point for a Worker; use a Worker with static assets and explicit API routing for the chosen project.

**Why:** The GitHub build checks link to Worker services, and the owner confirmed the failing project is a Worker. Adapting the code to the actual project type avoids configuring an unrelated Pages deployment.

**How to apply:** Confirm which of the two Git-connected Worker projects is the intended host. A production Wrangler config must use that Worker's exact name and a real D1 database ID; do not deploy a placeholder or a partial config that drops the D1 binding.

Cloudflare has reported a frozen-install `overrides` mismatch even though a fresh checkout of the published Worker source completed a full offline frozen install with pnpm 10.11.1 on Node 24, from both the workspace root and calculator directory. Treat the failing build's checkout commit and effective build environment as unverified until inspected; regenerating the lockfile locally is not evidence of a fix.

**Why:** Both the local workspace and a clean checkout passed with Cloudflare's reported pnpm version, so an override change in source is not established as the cause.

**How to apply:** Check the build's exact commit and root directory; then pin the intended pnpm version and clear the Cloudflare build cache before attempting changes to security or platform overrides.

GitHub connector access, shell Git credentials, and the Replit Git pane can differ. A connector read succeeded while its Git Data API write returned `403 Resource not accessible by integration`; shell Git push failed authentication even after the owner published the local branch through the Git pane.

**Why:** A failed shell push does not prove the remote is behind. A healthy read-only connector's OAuth context exposed no reauthorization scopes, so blindly reconnecting it was not an established way to obtain write access.

**How to apply:** Verify GitHub's actual branch SHA before attempting a push or claiming Cloudflare can pull new code. If it is behind, the owner can publish through the Git pane even when shell credentials fail.