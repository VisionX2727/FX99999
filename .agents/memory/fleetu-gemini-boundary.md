---
name: Fleetu Gemini boundary
description: Durable security and integration decisions for the Fleetu assistant.
---

Fleetu must call Gemini from the API server, never from the browser, and must construct context from the authenticated role before sending any prompt. Owner context may include the owner's workspace and connected driver summaries. Driver context is limited to that driver's assigned vehicles, own work logs, fuel, payments, notes, maintenance requests, and attendance.

**Why:** The managed Gemini setup and package installation were not usable, while exposing a model key or owner workspace through client code would weaken the Driver privacy boundary.

**How to apply:** Keep role filtering in the API route even if the UI hides features. Treat any request for owner, customer/khata, business-settings, fleet-private, or other-driver data from a Driver as out of scope and answer only from the driver's own records.

The configured Gemini key currently requires the `gemini-3.6-flash` model; a direct request to `gemini-2.5-flash` returned a provider-level model-unavailable error.

**Why:** Model availability is key-dependent and can change independently of the SDK or documentation, so a hardcoded older model can make Fleetu look completely broken.

**How to apply:** Keep the Fleetu Gemini model environment-overridable and verify the configured model with a minimal provider request before changing the privacy or context boundary.