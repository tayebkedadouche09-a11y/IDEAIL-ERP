# IDEAIL ERP Quality Gate

## BEFORE MARKING ANY TASK COMPLETE

You MUST execute ALL of the following checks.

---

# 1 Backend

✓ Server starts successfully

✓ No runtime exception

✓ No unhandled promise rejection

✓ No SQL error

✓ No migration error

✓ No missing table

✓ No missing column

✓ No missing route

✓ No duplicate routes

✓ No authentication issue

✓ JWT valid

✓ bcrypt valid

---

# 2 API

Verify every endpoint.

Expected status:

GET → 200

POST → 200/201

PUT → 200

DELETE → 200

No endpoint may return

404

400

401

403

409

422

500

unless explicitly expected.

---

# 3 Database

Verify

Foreign Keys

Indexes

Constraints

Default values

Triggers

Views

Null safety

No orphan records

No duplicated IDs

---

# 4 Frontend

Application builds.

Application starts.

No red screen.

No console error.

No React warning affecting execution.

Every page loads.

Every CRUD works.

Every button works.

Every dialog works.

Every search works.

Every pagination works.

---

# 5 Integration

Frontend ↔ Backend

Backend ↔ SQLite

JWT ↔ Middleware

CRUD ↔ Database

Reports ↔ Database

Dashboard ↔ Reports

Profitability ↔ Projects

Inventory ↔ Products

Employees ↔ Payroll

Vehicles ↔ Expenses

Everything must communicate correctly.

---

# 6 Regression

Run complete automated tests.

If ANY previous module breaks

STOP

Fix it first.

Never sacrifice an old module to complete a new one.

---

# FINAL DECISION

Only print

QUALITY GATE PASSED

when

Backend = OK

Frontend = OK

Database = OK

API = OK

Regression = OK

Coverage = 100%

Otherwise

continue fixing automatically.