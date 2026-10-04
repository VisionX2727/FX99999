---
name: Supabase secret handling
description: Credential hygiene for Supabase authentication and deployments.
---

Supabase project configuration must be injected through Replit environment values. Do not store the project URL, publishable key, anon key, service-role key, or database URL in tracked project files or Git history.

**Why:** A tracked Replit configuration file can be copied to GitHub and deployment providers, and removing a value later does not invalidate credentials that were already exposed.

**How to apply:** Keep `.replit` free of Supabase values, ignore local `.env` and key files, request fresh values through the secure secrets flow, and rotate any key that appeared in committed history.

**Migration access note:** The agent shell and the Fleet Manager API development workflow did not expose `SUPABASE_DB_URL` to a Drizzle push process even though Replit reported the secret as configured.

**Why:** Falling back to a different `DATABASE_URL` can apply schema changes to the wrong database.

**How to apply:** If the documented push cannot see the secret, stop before writing and have the user run it in a secret-enabled context; do not print or duplicate the connection string or silently substitute another database.