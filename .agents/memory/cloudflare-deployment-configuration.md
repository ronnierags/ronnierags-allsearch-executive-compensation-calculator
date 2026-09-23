---
name: Cloudflare deployment configuration
description: Deployment decisions and non-reproducible build errors for the calculator's Cloudflare Worker.
---

The existing Git-connected Cloudflare projects are Workers Builds, not Pages. A Pages Functions directory alone is not an entry point for a Worker; use a Worker with static assets and explicit API routing for the chosen project.

**Why:** The GitHub build checks link to Worker services, and the owner confirmed the failing project is a Worker. Adapting the code to the actual project type avoids configuring an unrelated Pages deployment.

**How to apply:** Confirm which of the two Git-connected Worker projects is the intended host. A production Wrangler config must use that Worker's exact name and a real D1 database ID; do not deploy a placeholder or a partial config that drops the D1 binding.

Cloudflare has reported a frozen-install `overrides` mismatch even though a fresh GitHub `main` clone completed the same frozen install with pnpm 10.11.1 on Node 24. Treat the failing build's checkout commit and effective build environment as unverified until inspected; regenerating the lockfile locally is not evidence of a fix.

**Why:** Both the local workspace and a clean GitHub checkout passed with Cloudflare's reported pnpm version, so an override change in source is not established as the cause.

**How to apply:** Check the build's exact commit and root directory; then pin the intended pnpm version and clear the Cloudflare build cache before attempting changes to security or platform overrides.

The current GitHub connector can read this repository but a Git Data API write returned `403 Resource not accessible by integration`, while direct Git push from the workspace failed authentication. Do not assume a connected GitHub integration can publish workspace commits.

**Why:** The healthy OAuth connection exposes no reauthorization scopes, so blindly reconnecting it is not an established way to obtain repository write access.

**How to apply:** Before claiming Cloudflare can pull new code, verify GitHub `main` contains the latest commit. If not, the repository owner must restore a write-capable Git connection or push the commits from their own Git tooling.