---
name: Express route specificity
description: Ordering rule for fixed business-action routes that overlap generic resource identifiers.
---

Register fixed routes such as role-level export endpoints before generic routes whose final segment is an identifier.

**Why:** Express matches in registration order. A generic route can otherwise consume a fixed word such as `export` as a party identifier and fail inside the wrong handler.

**How to apply:** Whenever a resource has both `/:id` and fixed suffixes at the same path depth, put fixed suffixes first or constrain the identifier route to the real identifier format.