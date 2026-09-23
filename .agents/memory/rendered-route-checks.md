---
name: Rendered-route checks
description: Why calculator fixes must be verified on the public route, not just in source.
---

When maintaining the calculator, identify the component actually rendered by the public route and test the complete request from that component before claiming PDF or email fixes.

**Why:** A prior repair landed in a different calculator component that was not rendered publicly. Static checks passed, but the live form still sent an invalid payload and provided no way to close its dialog.

**How to apply:** Trace the public route to its rendered component, then verify the live form's submission and feedback path. Avoid assuming similarly named components share behavior.