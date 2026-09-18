---
name: Drizzle foreign-key rollout
description: A development-schema ordering issue when a new table references a newly introduced unique non-primary key.
---

When introducing a table and another table that references its new non-primary unique key in the same Drizzle push, verify PostgreSQL creates the unique constraint before the foreign key.

**Why:** In this Replit PostgreSQL setup, the first push partially created the referenced table without its unique constraint and then failed while creating the foreign key. Repeating the push did not repair the ordering automatically.

**How to apply:** Prefer primary-key references where practical. If a natural-key foreign key is intentional, inspect the partial schema after a failed push, establish the missing non-destructive unique constraint, and rerun the normal schema push.