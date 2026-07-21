# IDEAIL ERP Phase Gate

## HARD RULE

No phase is considered complete unless ALL tests pass.

The minimum success criteria are:

Passed = 100%

Failed = 0

HTTP errors = 0

Console errors = 0

Build errors = 0

Unhandled exceptions = 0

Missing routes = 0

Missing SQL columns = 0

Missing imports = 0

Missing migrations = 0

Missing frontend pages = 0

Missing navigation = 0

Missing permissions = 0

Missing API integration = 0

---

## Validation Loop

For every phase:

Implement.

↓

Run automated tests.

↓

Read every failure.

↓

Fix every failure.

↓

Restart backend.

↓

Restart frontend.

↓

Run tests again.

↓

Repeat forever until:

Passed == ALL

Failed == 0

---

## Forbidden

Never continue to another module if:

- one endpoint returns 404
- one endpoint returns 500
- one SQL error exists
- one frontend error exists
- one build warning blocks execution
- one CRUD operation fails

---

## Completion Message

Only after ALL validation passes print exactly:

====================================

PHASE VERIFIED

Ready for next phase

Coverage: 100%

ERP Readiness: XX%

====================================

Otherwise print:

PHASE NOT VERIFIED

and continue fixing.