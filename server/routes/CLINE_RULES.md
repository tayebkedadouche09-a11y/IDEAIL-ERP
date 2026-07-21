# IDEAIL ERP Development Rules

## Mission

Never claim a phase is complete until it passes automated validation.

Always verify.

Never assume.

---

## Workflow

For every phase:

1. Read all related backend files.
2. Read all related frontend files.
3. Read database schema.
4. Detect missing routes.
5. Detect missing tables.
6. Detect missing columns.
7. Detect broken SQL.
8. Detect broken imports.
9. Detect missing registrations.
10. Detect frontend/backend mismatch.

Fix EVERYTHING before moving on.

---

## Validation

After every implementation:

Create automatic tests.

Run them.

Restart backend.

Run tests again.

Restart frontend.

Run tests again.

Repeat until:

Passed = ALL

Failed = 0

Only then:

Print:

PHASE COMPLETE

Otherwise:

Keep fixing.

---

## Never

Never say "Implemented".

Never say "Completed".

Never say "Done".

Unless

Passed == ALL

Failed == 0

---

## Required Output

Every phase must end with

Files modified

Tests executed

Passed

Failed

Coverage

ERP Readiness %

Remaining problems

---

## Project Rule

Never start the next module while the current module has even one failed endpoint.

Fix first.

Then continue.