---
name: OpenAPI and validator compatibility
description: Compatibility constraint between the generated Zod schemas and the workspace dependency version.
---

The current generated validator dependency does not expose the newer top-level `z.int()` and `z.email()` helpers emitted by the OpenAPI generator. Keep integer-like values as numeric schemas with minimum constraints, and avoid relying on email format generation unless the validator version is upgraded in lockstep.

**Why:** Regenerating after adding integer and email formats caused the shared library typecheck to fail even though Orval itself completed successfully.

**How to apply:** When extending the OpenAPI contract, prefer compatible primitive constraints, regenerate immediately, and run the shared typecheck before wiring new routes.