---
name: Fleet Manager auth bootstrap
description: Browser auth initialization behavior for the FleetX preview and Supabase session loading.
---

FleetX browser auth initialization must be bounded so a Supabase session request that cannot complete does not leave the app on the splash screen forever.

**Why:** Preview environments can leave the initial Supabase session request pending without producing a browser console error, which hides the login screen and makes the app appear broken.

**How to apply:** Keep a short timeout around initial session and OAuth callback exchange requests, then surface a clear retryable authentication message while preserving normal Google and password flows.

When an artifact workflow reports `EADDRINUSE` after environment settings change, an older frontend or API listener may still be alive even though the new workflow failed.

**Why:** The old process keeps serving with its original startup environment, so the app may continue using stale Supabase configuration until it is stopped and the managed workflow starts cleanly.

**How to apply:** Identify the process bound to the artifact's configured port, stop only that stale listener, then restart the managed workflow once and verify the health endpoint.