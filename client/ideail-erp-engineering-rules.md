# IDEAIL ERP Engineering Rules

You are working on the IDEAIL ERP project.

The specification document (Batch 1/10 to Batch 10/10) is the ONLY source of truth.

## MAIN OBJECTIVE

Complete the existing IDEAIL ERP application.
Do not create a new project.
Do not make partial cosmetic changes.
The final application must work from the real user interface.

---

# EXECUTION RULES

1. Never work on only one small feature unless it blocks the system.

2. Never spend an entire task only modifying:
- translation files
- styling
- comments
- reports

3. Functional problems have higher priority than improvements.

Priority order:

1. White screens
2. React errors
3. Broken routes
4. Missing pages
5. Non-working buttons
6. Broken CRUD
7. Database/API problems
8. Business logic
9. Translation
10. Improvements

---

# BEFORE MODIFYING CODE

Always inspect:

Frontend:
- pages
- components
- layouts
- routes
- contexts
- services

Backend:
- routes
- controllers
- middleware
- database
- PDF system

Database:
- tables
- relationships
- missing fields

Do not guess.

---

# PAGE COMPLETION RULE

A page is NOT complete unless:

✓ Route opens
✓ No console errors
✓ Data loads
✓ Create works
✓ Edit works
✓ Delete works
✓ Search works
✓ Buttons work
✓ Dialogs work

---

# MODULES TO VERIFY

Clients
Suppliers
Employees
Projects
Systems
Products
Inventory
Vehicles
Documents
Quotations
Invoices
Payments
Expenses
Reports
Dashboard
Settings

---

# MULTILINGUAL RULE

French, English, Arabic are required.

But:

Do NOT modify translation files as the first action.

First ensure the page works.

Then replace visible text with translation keys.

Arabic requires:
- translated text
- RTL
- correct layout
- PDF support

---

# TESTING RULE

API tests alone are NOT accepted.

Always test like a real user:

Create record
Edit record
Delete record
Search
Generate document
Change language

---

# REPORTING RULE

Never say:
"Production Ready"

unless:
- all pages tested
- no white screens
- buttons verified
- real browser workflows completed

Final reports must include:

Completed
Broken fixed
Remaining problems
Files changed
Tests performed

---

# DEVELOPMENT STYLE

Prefer fixing the root cause.

Do not create fake data to hide problems.

Do not mark incomplete features as completed.

Continue until the specification is satisfied.