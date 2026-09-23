---
name: Fleet Manager auth bootstrap
description: Browser auth initialization behavior for the FleetX preview and Supabase session loading.
---

FleetX browser auth initialization must be bounded so a Supabase session request that cannot complete does not leave the app on the splash screen forever.

**Why:** Preview environments can leave the initial Supabase session request pending without producing a browser console error, which hides the login screen and makes the app appear broken.

**How to apply:** Keep a short timeout around initial session and OAuth callback exchange requests, then surface a clear retryable authentication message while preserving normal Google and password flows.