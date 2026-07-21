Current Development Status & Continuation Instructions
Project Continuation Requirement

The development team must NOT restart the project from zero.

The existing IDEAIL ERP project has already been partially developed.

The developer must first review and understand the current implementation, including:

Existing frontend React application.
Existing backend Node.js / Express API.
Existing SQLite database.
Existing modules already created.
Existing API routes.
Existing UI components.

The work must continue from the current project state.

Current Development Point

The project has already reached the following stage:

Completed Foundation

✓ React + Vite frontend created.
✓ Node.js + Express backend created.
✓ SQLite database connected.
✓ Basic API structure implemented.
✓ Frontend-backend communication established.
✓ Clients module started and connected to database.

Immediate Development Priority

The developer must continue from the current state:

Verify and stabilize existing code.
Complete missing CRUD operations.
Connect all existing pages to the real backend.
Remove placeholders and demo data.
Continue implementing ERP modules according to this specification.
Important Instruction

The goal is not to recreate IDEAIL ERP from the beginning.

The goal is:

Continue the existing IDEAIL ERP development until reaching a complete production-ready ERP system.

IDEAIL ERP
Executive Technical Specification
Batch 1/10
Project Vision & Core System Architecture
1. Project Overview
Project Name

IDEAIL ERP

Company

SARL IDEAIL ROUVETMON

Business Domain

IDEAIL ERP is a complete Enterprise Resource Planning system designed specifically for an industrial coating company specialized in:

Industrial flooring systems
Epoxy coatings
Resin applications
Polyurethane systems
Decorative concrete
Waterproofing solutions
Technical surface protection
Industrial construction works

The objective is to centralize all company operations into one professional digital platform.

2. Main Purpose of the ERP System

The IDEAIL ERP system must replace manual processes and scattered documents with a unified management solution.

The system must allow the company to manage:

Customers
Suppliers
Employees
Projects
Materials
Inventory
Quotations
Invoices
Payments
Expenses
Taxes
Reports
Business performance indicators

The ERP must provide accurate information about:

Project cost
Material consumption
Project profitability
Company financial status
Customer debts
Supplier obligations
3. Business Objectives

The main objectives are:

3.1 Digital Transformation

Replace:

Paper documents
Excel files
Manual calculations
Independent records

with:

Central database
Automated workflows
Real-time information
3.2 Improve Project Management

The system must allow management to follow each project from:

Customer request

↓

Quotation

↓

Project creation

↓

Material calculation

↓

Execution

↓

Expenses tracking

↓

Invoice generation

↓

Payment collection

↓

Profit analysis

3.3 Improve Financial Control

The ERP must provide:

Revenue monitoring
Expense tracking
Profit calculation
VAT management
Payment follow-up
Financial reports
4. System Characteristics

The application must be:

Simple

Easy for daily company operations.

Fast

Quick access to information and transactions.

Professional

Designed according to modern ERP standards.

Scalable

Ready for future expansion:

More users
More branches
Cloud deployment
Mobile application
Advanced accounting
5. Target Platforms

The ERP system must support:

Desktop
Windows
Linux
macOS
Mobile Devices
Smartphones
Tablets

The interface must be fully responsive.

6. Language Support

The system must support three languages:

French (FR)

Main administrative language.

Arabic (AR)

Including:

RTL interface
Arabic reports
Arabic menus
English (EN)

For international expansion and technical operations.

7. Currency & Tax Management
Main Currency

The default currency:

DZD — Algerian Dinar

The architecture must allow adding future currencies:

EUR
USD
Other currencies
Tax Management

The system must support:

VAT calculation
Daily tax tracking
Monthly VAT reports
Annual VAT reports
8. Technical Architecture Overview

The system follows a modern three-layer architecture:

                 IDEAIL ERP

                     |

        ----------------------------

        Frontend              Backend

        React.js              Node.js
        Material UI            Express.js

        ----------------------------

                     |

                 Database

              SQLite / PostgreSQL

9. Frontend Architecture
Technology Stack

The frontend must use:

React.js
Material UI (MUI)
React Router
Axios
React Query
React Hook Form
i18next
Chart.js
Recharts
DayJS
10. Frontend Project Structure
client/

src/

├── assets/
│
├── components/
│
├── pages/
│
├── layouts/
│
├── routes/
│
├── hooks/
│
├── context/
│
├── services/
│
├── utils/
│
├── styles/
│
└── languages/
    ├── ar/
    ├── fr/
    └── en/
11. Backend Architecture
Technology Stack

The backend must use:

Node.js
Express.js
REST API
12. Backend Project Structure
server/

├── routes/
│
├── controllers/
│
├── services/
│
├── middlewares/
│
├── database/
│
├── uploads/
│
├── pdf/
│
├── logs/
│
├── config/
│
└── utils/
13. Database Architecture
Development Database

SQLite

Used for:

Local development
Initial deployment
Testing
Production Database

PostgreSQL

Required for:

Multiple users
Large data volume
Cloud deployment
Advanced reporting
14. Database Rules

The system must use:

Pure SQL

No ORM dependency.

Reasons:

Full SQL control
Better PostgreSQL compatibility
Easier database migration
Better performance optimization
15. API Architecture

The system must expose REST APIs.

Example:

Clients API
GET     /api/clients

POST    /api/clients

PUT     /api/clients/:id

DELETE  /api/clients/:id
Projects API
GET     /api/projects

POST    /api/projects

PUT     /api/projects/:id

DELETE  /api/projects/:id
16. Authentication & Security

The system must implement:

Authentication

JWT Token based authentication.

Password Security

Passwords must be encrypted using:

bcrypt hashing algorithm.

17. User Roles

The system must support role-based permissions.

Administrator

Full access.

Accountant

Access to:

Invoices
Payments
Expenses
Financial reports
Project Manager

Access to:

Projects
Materials
Workers
Project reports
Storekeeper

Access to:

Inventory
Stock movements
Materials
Employee

Limited operational access.

18. Development Standards

Every module must include:

Create
Read
Update
Delete
Search
Export
Validation
Error handling
Permission control
19. Quality Requirements

Before considering any module completed:

The development team must verify:

✓ Backend API working
✓ Frontend connected to real database
✓ No demo data
✓ Search working
✓ Forms validated
✓ Permissions working
✓ Responsive design verified
✓ Error handling implemented

IDEAIL ERP
Executive Technical Specification
Batch 2/10
Database Design & Data Architecture
1. Database Architecture Overview

The IDEAIL ERP database must be designed to support:

Daily company operations.
Industrial project management.
Financial tracking.
Inventory control.
Multi-user access.
Future migration from SQLite to PostgreSQL.

The database design must follow:

Data integrity principles.
Clear relationships between entities.
Scalability requirements.
Performance optimization.
2. Database Technology
Development Environment

Database:

SQLite

Purpose:

Local development.
Testing.
Initial deployment.
Production Environment

Database:

PostgreSQL

Purpose:

Multi-user environment.
Large company data.
Cloud deployment.
Advanced reporting.
3. Database Design Rules

The database must follow:

Primary Keys

Every table must have:

id INTEGER PRIMARY KEY
Timestamps

Every main table must include:

created_at
updated_at
Data Integrity

Required:

Foreign keys.
Validation rules.
Unique constraints.
Required fields.
4. Main Database Modules

The database is divided into:

SYSTEM MANAGEMENT

    Users
    Roles
    Permissions
    Logs


MASTER DATA

    Clients
    Suppliers
    Employees
    Products
    Materials


OPERATIONS

    Projects
    Tasks
    Stock Movements
    Documents


FINANCE

    Quotes
    Invoices
    Payments
    Expenses
    Taxes


REPORTING

    Statistics
    Dashboard Data
5. Users Management Tables
Table: users

Purpose:

Store system users.

Fields:

id
first_name
last_name
username
email
password_hash
role_id
phone
status
last_login
created_at
updated_at
Table: roles

Purpose:

Define user roles.

Fields:

id
name
description
created_at

Examples:

Administrator
Accountant
Project Manager
Storekeeper
Employee
Table: permissions

Purpose:

Control module access.

Fields:

id
role_id
module_name
can_create
can_read
can_update
can_delete
6. Clients Module Database
Table: clients

Purpose:

Store customer information.

Fields:

id

company_name

contact_person

phone

email

address

city

country

NIF

NIS

RC

AI

notes

status

created_at

updated_at
Client Requirements

The system must support:

Individual customers.
Companies.
Industrial clients.
Complete customer history.
7. Suppliers Module Database
Table: suppliers

Fields:

id

company_name

contact_person

phone

email

address

NIF

NIS

RC

payment_terms

notes

created_at

updated_at
8. Employees Module Database
Table: employees

Purpose:

Manage workers and company staff.

Fields:

id

first_name

last_name

phone

position

salary

hire_date

status

documents

notes

created_at

updated_at
9. Projects Module Database

This is the core module of IDEAIL ERP.

Table: projects

Fields:

id

project_code

project_name

client_id

manager_id

project_type

surface_area

location

description

start_date

end_date

status

estimated_cost

actual_cost

selling_price

profit_amount

created_at

updated_at
Project Status Values

Example:

Draft

Quotation

Approved

In Progress

Completed

Cancelled
10. Project Materials Table
Table: project_materials

Purpose:

Track materials used in each project.

Fields:

id

project_id

product_id

planned_quantity

used_quantity

unit_price

total_cost

waste_quantity

created_at
11. Products & Materials Database
Table: products

Purpose:

Manage all materials and products.

Examples:

Resin
Epoxy
Hardener
Primer
Quartz
Sand
Cement
Pigments
Tools
Consumables

Fields:

id

reference_code

name

category

unit

purchase_price

selling_price

minimum_stock

current_stock

supplier_id

created_at

updated_at
12. Stock Movement Table
Table: stock_movements

Purpose:

Record every inventory change.

Fields:

id

product_id

movement_type

quantity

reference_type

reference_id

user_id

date

notes
Movement Types

Examples:

PURCHASE

PROJECT_USAGE

RETURN

ADJUSTMENT

LOSS
13. Documents Management
Table: documents

Purpose:

Store company files.

Fields:

id

entity_type

entity_id

file_name

file_path

file_type

uploaded_by

created_at

Examples:

Documents linked to:

Clients.
Projects.
Employees.
Suppliers.
Invoices.
14. Vehicles Module
Table: vehicles

Fields:

id

registration_number

brand

model

year

driver

insurance_date

technical_control_date

status

notes
15. Financial Tables Overview

The financial database will include:

quotes

invoices

payments

expenses

debts

tax_records
16. Database Relationship Overview

Main relationships:

CLIENT

  |

  |---- PROJECTS

              |

              |---- PROJECT MATERIALS

              |

              |---- INVOICES

              |

              |---- PAYMENTS


SUPPLIER

  |

  |---- PRODUCTS


PRODUCTS

  |

  |---- STOCK MOVEMENTS
17. Database Performance Requirements

The database must include indexes for:

Client search.
Invoice numbers.
Project codes.
Product references.
Dates.
18. Backup Requirements

The system must support:

Manual backup.
Automatic backup.
Database export.
Restore operation.

Supported formats:

SQL Backup.
CSV Export.

IDEAIL ERP
Executive Technical Specification
Batch 3/10
Clients, Suppliers & Employees Modules Specification
1. Module Overview

The Clients, Suppliers, and Employees modules are core master data components of IDEAIL ERP.

These modules provide centralized management of all external and internal company contacts.

The system must provide:

Complete information management.
Search functionality.
Document attachment.
History tracking.
Export capabilities.
Permission control.
PART A — CLIENTS MODULE
2. Clients Module Objectives

The Clients module manages all customers who request:

Industrial coating projects.
Epoxy flooring works.
Resin applications.
Waterproofing projects.
Technical coating services.

The system must maintain a complete customer profile.

3. Client Data Structure
Client Information

The client profile must include:

Client ID

Company Name

Contact Person

Phone Number

Email

Address

City

Country

NIF

NIS

RC

AI

Client Type

Notes

Status

Created Date

Updated Date
4. Client Types

The system must support:

Company

Individual

Industrial Customer

Government Organization

Construction Partner
5. Client Operations (CRUD)

The module must support:

Create Client

Users can create a new customer.

Required validation:

Company name cannot be empty.
Phone number format validation.
Duplicate customer detection.
View Client

The profile page must display:

Basic Information
Identity.
Contact details.
Registration information.
Business Information
Projects.
Quotations.
Invoices.
Payments.
Outstanding debts.
Documents
Contracts.
Certificates.
Attachments.
Edit Client

Authorized users can update:

Contact information.
Company information.
Notes.

All changes must be logged.

Delete Client

Deletion rules:

A client cannot be permanently deleted if linked to:

Projects.
Invoices.
Payments.

The system should use:

Soft Delete

Example:

status = inactive
6. Client Search System

The system must provide global search.

Search by:

Company name.
Contact person.
Phone.
Email.
NIF.
NIS.
RC.
7. Client Export

Supported formats:

PDF
Excel
CSV

Export examples:

Client list.
Client financial history.
Project history.
8. Client Dashboard

Each client profile should display:

Total Projects

Total Invoiced Amount

Total Paid Amount

Remaining Debt

Last Activity

Documents
PART B — SUPPLIERS MODULE
9. Suppliers Module Objectives

The Suppliers module manages companies providing:

Resin materials.
Epoxy products.
Tools.
Equipment.
Consumables.
Industrial supplies.
10. Supplier Data Structure
Supplier ID

Company Name

Contact Person

Phone

Email

Address

NIF

NIS

RC

Payment Terms

Bank Information

Notes

Status

Created Date

Updated Date
11. Supplier Operations

The module must support:

Create Supplier

Validation:

Supplier name required.
Duplicate checking.
View Supplier

Display:

Supplier information.
Purchased materials.
Purchase history.
Payments.
Outstanding balance.
Edit Supplier

Allow updating:

Contact details.
Payment conditions.
Notes.
Delete Supplier

Restrictions:

Cannot delete suppliers linked to:

Products.
Purchases.
Payments.

Use inactive status instead.

12. Supplier Search

Search by:

Company name.
Contact person.
Phone.
Registration number.
13. Supplier Reports

Generate:

Supplier list.
Purchase history.
Payment status.
Outstanding debts.
PART C — EMPLOYEES MODULE
14. Employees Module Objectives

The Employees module manages:

Workers.
Technicians.
Supervisors.
Administrative staff.
15. Employee Data Structure
Employee ID

First Name

Last Name

Phone

Email

Position

Department

Hire Date

Salary

Employment Status

Emergency Contact

Documents

Notes

Created Date

Updated Date
16. Employee Positions

Examples:

Project Manager

Epoxy Technician

Worker

Driver

Accountant

Administrative Staff
17. Employee Operations
Create Employee

Required:

Name.
Position.
Status.
Employee Profile

The profile must show:

Personal Information

Assigned Projects

Work History

Documents

Salary Information

Performance Notes
Edit Employee

Authorized users can modify:

Contact information.
Position.
Status.
Employee Documents

Support uploading:

ID documents.
Contracts.
Certificates.
Training documents.
18. Employee-Project Connection

Employees can be assigned to projects.

Relationship:

PROJECT

     |

PROJECT_EMPLOYEES

     |

EMPLOYEE

The system must track:

Assigned worker.
Working days.
Cost per project.
19. API Requirements
Clients API
GET    /api/clients

POST   /api/clients

GET    /api/clients/:id

PUT    /api/clients/:id

DELETE /api/clients/:id
Suppliers API
GET    /api/suppliers

POST   /api/suppliers

GET    /api/suppliers/:id

PUT    /api/suppliers/:id

DELETE /api/suppliers/:id
Employees API
GET    /api/employees

POST   /api/employees

GET    /api/employees/:id

PUT    /api/employees/:id

DELETE /api/employees/:id
20. Security Requirements

Permissions:

Administrator

Full access.

Accountant

View clients/suppliers + financial information.

Project Manager

View clients related to assigned projects.

Employee

Limited access.

21. Quality Checklist

Before module completion:

✓ Create works
✓ Edit works
✓ Delete restrictions implemented
✓ Search works
✓ Export works
✓ Documents upload works
✓ Permissions tested
✓ Database connected
✓ No fake data

IDEAIL ERP
Executive Technical Specification
Batch 4/10
Project Management Module Specification
1. Module Overview

The Project Management Module is the central operational module of IDEAIL ERP.

It is designed specifically for industrial coating activities:

Epoxy flooring systems.
Resin applications.
Polyurethane coatings.
Decorative concrete.
Waterproofing projects.
Industrial protection systems.

The module must manage the complete project lifecycle:

Customer Request

↓

Quotation

↓

Project Creation

↓

Planning

↓

Material Calculation

↓

Execution

↓

Expenses Tracking

↓

Invoice

↓

Payment

↓

Profit Analysis
2. Project Module Objectives

The system must allow the company to:

Create and manage projects.
Track project progress.
Calculate project cost automatically.
Monitor material consumption.
Track workers involved.
Record project expenses.
Compare estimated cost vs real cost.
Calculate final project profit.
3. Project Data Structure
Table: projects
id

project_code

project_name

client_id

project_manager_id

project_type

system_type

location

surface_area

description

start_date

expected_end_date

actual_end_date

status

estimated_amount

final_amount

estimated_cost

actual_cost

profit_amount

profit_margin

notes

created_at

updated_at
4. Project Identification

Each project must have a unique code.

Example:

PRJ-2026-001

PRJ-2026-002

PRJ-2026-003

The code is used for:

Searching.
Reporting.
Document references.
Financial tracking.
5. Project Types

The system must support different project categories.

Examples:

Industrial Floor Coating

Epoxy Self-Leveling

Epoxy Mortar

Polyurethane Flooring

Resin Decoration

Waterproofing

Concrete Protection

Maintenance Work
6. Coating System Management

Each project can use one or more technical systems.

Example:

Project:

Factory Floor Renovation

System:

Epoxy Self-Leveling

Layers:

1. Primer

2. Epoxy Base

3. Hardener

4. Top Coat
7. Surface Calculation

The project must store:

Surface Area (m²)

Thickness (mm)

Consumption Rate

Required Quantity

Example:

Area:
500 m²

Consumption:
1.5 kg/m²

Required Material:
750 kg
8. Project Material Planning

The system must calculate planned materials.

Table:

project_materials
id

project_id

product_id

planned_quantity

unit

unit_price

planned_cost

actual_quantity

actual_cost

difference

created_at
9. Material Consumption Tracking

During execution, employees can record:

Used quantity.
Remaining quantity.
Waste quantity.

Example:

Planned:

100 kg Epoxy

Used:

92 kg

Waste:

8 kg
10. Automatic Cost Calculation

The system calculates:

Material Cost
Material Quantity × Unit Price
Labor Cost
Working Days × Employee Daily Cost
Other Expenses

Examples:

Transport.
Equipment rental.
Fuel.
Maintenance.
External services.
Total Project Cost

Formula:

Total Cost =

Materials

+

Labor

+

Additional Expenses
11. Project Employees

The system must allow assigning employees.

Table:

project_employees
id

project_id

employee_id

role

working_days

daily_cost

total_cost

Example:

Project:

Industrial Warehouse Floor

Workers:

3 technicians

Duration:

10 days

Total Labor Cost:

300,000 DZD
12. Project Expenses

Every project can have specific expenses.

Table:

project_expenses
id

project_id

expense_type

description

amount

date

created_by

Expense Types:

Transportation

Fuel

Equipment Rental

External Worker

Tools

Other
13. Project Status Management

Project workflow:

Draft

↓

Quotation Sent

↓

Approved

↓

Planning

↓

In Progress

↓

Quality Control

↓

Completed

↓

Archived
14. Project Dashboard

Each project page must display:

General Information
Client.
Location.
Dates.
Status.
Financial Overview
Contract Value

Estimated Cost

Actual Cost

Gross Profit

Profit Margin
Progress
Completion Percentage

Tasks Completed

Remaining Work
15. Project Documents

The system must support attachments:

Contracts.
Technical documents.
Site photos.
Plans.
Certificates.
Reports.

Storage:

uploads/projects/
16. Project Photos

The system must allow:

Before / During / After photos.

Example:

Before Work

↓

Execution Stage

↓

Final Result
17. Project Search

Search by:

Project code.
Project name.
Client name.
Location.
Status.
Date range.
18. Project Reports

The system must generate:

Project Cost Report

Contains:

Planned cost.
Actual cost.
Difference.
Project Profit Report

Contains:

Selling Price

-

Total Cost

=

Net Profit
Material Usage Report

Contains:

Planned quantity.
Used quantity.
Waste.
19. Project API Requirements
GET    /api/projects

POST   /api/projects

GET    /api/projects/:id

PUT    /api/projects/:id

DELETE /api/projects/:id
Materials API
GET    /api/projects/:id/materials

POST   /api/projects/:id/materials

PUT    /api/project-materials/:id

DELETE /api/project-materials/:id
Expenses API
GET    /api/projects/:id/expenses

POST   /api/projects/:id/expenses
20. Business Rules

The system must:

✓ Prevent project creation without a client.
✓ Automatically calculate project cost.
✓ Update stock when materials are consumed.
✓ Link invoices to projects.
✓ Link payments to projects.
✓ Keep complete project history.
✓ Calculate final profit automatically.

21. Quality Checklist

Before completion:

✓ Project CRUD works
✓ Materials connected
✓ Employees connected
✓ Expenses connected
✓ Stock integration works
✓ Profit calculation verified
✓ Reports generated
✓ Photos and documents uploaded
✓ Permissions tested

IDEAIL ERP
Executive Technical Specification
Batch 5/10
Materials, Products & Inventory Management Module Specification
1. Module Overview

The Materials & Inventory Management Module is responsible for managing all company materials, products, equipment, and consumables.

This module is critical for IDEAIL ROUVETMON because industrial coating projects depend heavily on:

Accurate material calculation.
Stock availability.
Consumption tracking.
Purchase management.
Waste monitoring.

The system must provide complete visibility of:

Current stock.
Material usage per project.
Purchase history.
Supplier relationships.
Inventory costs.
2. Module Objectives

The Inventory Module must allow the company to:

Manage all products and materials.
Track stock quantities in real time.
Record purchases.
Record material consumption.
Automatically update stock after project usage.
Detect low stock situations.
Calculate material costs.
Reduce material losses.
3. Product Categories

The system must support different categories.

Examples:

RESIN MATERIALS

- Epoxy Resin
- Polyurethane Resin
- Decorative Resin


HARDENERS

- Epoxy Hardener
- PU Hardener


PRIMERS

- Epoxy Primer
- Moisture Barrier Primer


AGGREGATES

- Quartz
- Sand
- Mineral Fillers


CONSTRUCTION MATERIALS

- Cement
- Additives
- Pigments


TOOLS & CONSUMABLES

- Rollers
- Brushes
- Protective Equipment
- Packaging
4. Product Database Structure
Table: products
id

reference_code

barcode

name

category_id

description

unit

purchase_price

selling_price

supplier_id

minimum_stock

current_stock

location

status

created_at

updated_at
5. Product Categories
Table: product_categories
id

name

description

created_at

Examples:

Epoxy Products

Resin

Primer

Tools

Consumables
6. Units Management

The system must support different measurement units.

Examples:

KG

Liter

M²

Piece

Bag

Can

Meter
7. Supplier Connection

Each product can be linked to a supplier.

Relationship:

SUPPLIER

      |

      |

  PRODUCTS

The system must store:

Main supplier.
Purchase price.
Purchase history.
8. Stock Management

The system must maintain real-time stock.

Stock information:

Product Name

Current Quantity

Minimum Quantity

Warehouse Location

Last Movement

Stock Value
9. Stock Movement System

Every stock change must create a record.

Table: stock_movements
id

product_id

movement_type

quantity

unit_price

reference_type

reference_id

user_id

date

notes
10. Stock Movement Types

The system must support:

PURCHASE

↓

Increase Stock


PROJECT CONSUMPTION

↓

Decrease Stock


RETURN

↓

Increase Stock


LOSS

↓

Decrease Stock


ADJUSTMENT

↓

Manual Correction
11. Purchase Management

The system must record material purchases.

Purchase workflow:

Supplier

↓

Purchase Order

↓

Material Reception

↓

Stock Update

↓

Supplier Payment
12. Purchase Data Structure
Table: purchases
id

supplier_id

purchase_number

purchase_date

total_amount

payment_status

notes

created_at
Table: purchase_items
id

purchase_id

product_id

quantity

unit_price

total_price
13. Project Material Consumption Integration

The inventory system must connect directly with projects.

Example:

Project:

Industrial Factory Floor

Area:

1000 m²

Required materials:

Epoxy Resin:
500 KG

Primer:
100 KG

Quartz:
300 KG

When consumption is confirmed:

Stock automatically decreases.

14. Material Cost Calculation

The system must calculate:

Material Cost =

Quantity Used

×

Unit Purchase Price

Example:

Epoxy:

200 KG

×

800 DZD

=

160,000 DZD
15. Stock Alerts

The system must generate notifications when:

Stock reaches minimum level.
Product is unavailable.
Expiry date is approaching (if applicable).

Example:

WARNING:

Epoxy Primer stock below minimum level.
16. Warehouse Management

The system must support:

One warehouse initially.
Multiple warehouses in future.

Table:

warehouses
id

name

location

manager

created_at
17. Inventory Reports

The system must generate:

Stock Report

Includes:

Product list.
Quantity.
Value.
Consumption Report

Includes:

Project.
Material used.
Quantity.
Cost.
Purchase Report

Includes:

Supplier.
Date.
Amount.
Materials.
Waste Report

Includes:

Planned quantity.
Used quantity.
Loss quantity.
18. Inventory API Requirements
Products API
GET    /api/products

POST   /api/products

GET    /api/products/:id

PUT    /api/products/:id

DELETE /api/products/:id
Stock API
GET    /api/stock

GET    /api/stock/movements

POST   /api/stock/movement
Purchase API
GET    /api/purchases

POST   /api/purchases

GET    /api/purchases/:id
19. Business Rules

The system must:

✓ Never allow negative stock without authorization.
✓ Automatically update stock after confirmed operations.
✓ Link consumption to projects.
✓ Track every stock movement.
✓ Keep inventory history.
✓ Calculate material cost automatically.
✓ Generate low-stock notifications.

20. Quality Checklist

Before completion:

✓ Product CRUD completed
✓ Categories working
✓ Suppliers connected
✓ Purchases working
✓ Stock calculation verified
✓ Project consumption connected
✓ Reports generated
✓ Alerts tested
✓ Permissions implemented

IDEAIL ERP
Executive Technical Specification
Batch 6/10
Financial & Accounting Module Specification
1. Module Overview

The Financial & Accounting Module is responsible for managing all financial operations of IDEAIL ROUVETMON.

This module provides complete control over:

Quotations.
Invoices.
Customer payments.
Supplier payments.
Expenses.
Debts.
Taxes.
Financial reports.

The objective is to provide a clear financial vision of the company in real time.

2. Financial Module Objectives

The system must allow the company to:

Create professional quotations.
Convert quotations into invoices.
Track payments.
Monitor unpaid invoices.
Manage expenses.
Calculate project profitability.
Track VAT.
Generate financial reports.
3. Financial Workflow

The standard workflow:

Customer Request

↓

Quotation (Devis)

↓

Approval

↓

Project Creation

↓

Invoice Generation

↓

Payment Collection

↓

Financial Report
PART A — QUOTATIONS MODULE (DEVIS)
4. Quotation Management

The quotation module manages commercial offers sent to customers.

A quotation must contain:

Customer information.
Project information.
Services.
Materials.
Prices.
Taxes.
Validity period.
5. Quotation Database Structure
Table: quotations
id

quotation_number

client_id

project_id

quotation_date

valid_until

status

subtotal

discount

tax_amount

total_amount

notes

created_by

created_at

updated_at
6. Quotation Items
Table: quotation_items
id

quotation_id

description

quantity

unit

unit_price

discount

tax_rate

total_price
7. Quotation Status

The system must support:

Draft

Sent

Approved

Rejected

Expired

Converted
8. Quotation Features

The system must provide:

✓ Create quotation
✓ Edit quotation
✓ Duplicate quotation
✓ Generate PDF
✓ Send quotation
✓ Convert quotation to invoice

PART B — INVOICES MODULE (FACTURES)
9. Invoice Management

The invoice module manages all customer billing.

Invoices can be generated from:

Approved quotations.
Projects.
Manual creation.
10. Invoice Database Structure
Table: invoices
id

invoice_number

client_id

project_id

quotation_id

invoice_date

due_date

status

subtotal

tax_amount

total_amount

paid_amount

remaining_amount

created_by

created_at

updated_at
11. Invoice Status

Examples:

Draft

Issued

Partially Paid

Paid

Overdue

Cancelled
12. Invoice Items
Table: invoice_items
id

invoice_id

description

quantity

unit_price

tax_rate

total_price
13. Invoice PDF Generation

The system must generate professional PDF invoices containing:

Company:

Name.
Logo.
Address.
Tax information.

Customer:

Name.
Address.
Registration information.

Invoice:

Number.
Date.
Items.
Amount.
VAT.
Total.
PART C — PAYMENTS MODULE
14. Payment Management

The system must track all received and outgoing payments.

Payment types:

Customer Payment

Supplier Payment

Expense Payment

Other Payment
15. Payments Database Structure
Table: payments
id

payment_reference

payment_type

client_id

supplier_id

invoice_id

amount

payment_method

payment_date

notes

created_by

created_at
16. Payment Methods

Examples:

Cash

Bank Transfer

Cheque

Card

Other
17. Payment Tracking

The system must display:

For each customer:

Total Invoices

Total Paid

Remaining Balance

Payment History
PART D — EXPENSES MODULE
18. Expense Management

The company must record all operational expenses.

Examples:

Fuel

Transportation

Equipment

Maintenance

Salaries

Materials

Rent

External Services
19. Expense Database Structure
Table: expenses
id

expense_number

category

description

amount

date

payment_method

project_id

supplier_id

created_by

created_at
20. Expense Categories

The system must support:

Project Expense

Administrative Expense

Vehicle Expense

Material Expense

Employee Expense

Other Expense
PART E — DEBTS MANAGEMENT
21. Customer Debts

The system must automatically calculate:

Customer Debt =

Total Invoices

-

Total Payments
22. Supplier Debts

The system must calculate:

Supplier Debt =

Purchases

-

Supplier Payments
23. Debt Reports

The system must generate:

Customer debt list.
Supplier debt list.
Payment deadlines.
Overdue payments.
PART F — VAT MANAGEMENT
24. VAT Calculation

The system must support:

VAT percentage configuration.
Automatic VAT calculation.
VAT reporting.
25. VAT Records
Table: tax_records
id

period

tax_type

sales_amount

purchase_amount

vat_collected

vat_paid

balance

created_at
26. VAT Reports

Generate:

Monthly VAT Report

Contains:

Sales VAT.
Purchase VAT.
Difference.
Annual VAT Report

Contains:

Total revenue.
Total expenses.
VAT balance.
PART G — FINANCIAL REPORTS
27. Required Reports

The system must provide:

Sales Report

Includes:

Sales by period.
Sales by customer.
Sales by project.
Expense Report

Includes:

Expense categories.
Monthly expenses.
Project expenses.
Profit Report

Formula:

Profit =

Revenue

-

(Material Cost

+

Labor Cost

+

Expenses)
Cash Flow Report

Includes:

Incoming payments.
Outgoing payments.
Balance.
28. Financial Dashboard Indicators

The dashboard must display:

Total Revenue

Total Expenses

Net Profit

Pending Payments

Customer Debts

Supplier Debts

VAT Status
29. Financial API Requirements
Quotations
GET    /api/quotations

POST   /api/quotations

PUT    /api/quotations/:id

DELETE /api/quotations/:id
Invoices
GET    /api/invoices

POST   /api/invoices

GET    /api/invoices/:id
Payments
GET    /api/payments

POST   /api/payments

GET    /api/payments/:id
30. Business Rules

The system must:

✓ Prevent invoice without customer.
✓ Link invoices to projects.
✓ Update debts automatically.
✓ Generate financial history.
✓ Calculate profit automatically.
✓ Track VAT.
✓ Generate PDF documents.
✓ Keep audit logs.

31. Quality Checklist

Before completion:

✓ Quotations working
✓ Invoice generation working
✓ PDF export working
✓ Payments recorded
✓ Debts calculated
✓ VAT reports working
✓ Profit calculation verified
✓ Financial dashboard connected

IDEAIL ERP
Executive Technical Specification
Batch 7/10
Dashboard & Business Intelligence Module Specification
1. Module Overview

The Dashboard & Business Intelligence Module provides company management with a real-time overview of business performance.

This module transforms operational data into meaningful information to support decision-making.

The dashboard must provide visibility into:

Sales performance.
Project performance.
Financial situation.
Inventory status.
Customer activity.
Company profitability.
2. Dashboard Objectives

The system must allow management to:

Monitor company performance.
Identify problems quickly.
Track financial indicators.
Analyze project profitability.
Make better strategic decisions.
3. User-Specific Dashboards

The dashboard must adapt according to user roles.

Administrator Dashboard

Full company overview:

Revenue.
Expenses.
Profit.
Projects.
Customers.
Debts.
Inventory.
Accountant Dashboard

Focus on:

Invoices.
Payments.
Expenses.
VAT.
Financial reports.
Project Manager Dashboard

Focus on:

Active projects.
Project progress.
Materials.
Workers.
Project costs.
Storekeeper Dashboard

Focus on:

Stock levels.
Material consumption.
Low stock alerts.
Purchases.
4. Executive Dashboard Layout

The main dashboard must contain:

------------------------------------------------

                 IDEAIL ERP Dashboard


 KPI CARDS

 Revenue | Expenses | Profit | Projects


------------------------------------------------


 CHARTS

 Sales Trend

 Expense Analysis

 Profit Evolution


------------------------------------------------


 OPERATIONS

 Active Projects

 Pending Payments

 Stock Alerts


------------------------------------------------
5. Key Performance Indicators (KPIs)

The dashboard must display important indicators.

Financial KPIs
Total Revenue

Calculation:

Total Invoices Amount
Total Expenses

Calculation:

All Recorded Expenses
Net Profit

Calculation:

Revenue - Expenses
Outstanding Payments

Display:

Unpaid invoices.
Late payments.
6. Project KPIs

The dashboard must display:

Total Projects

Active Projects

Completed Projects

Delayed Projects

Average Project Profit
7. Project Performance Analytics

The system must analyze:

Project Cost

Compare:

Estimated Cost

VS

Actual Cost
Project Profitability

Display:

Project Revenue

-

Project Cost

=

Profit
8. Sales Analytics

The system must provide:

Sales Evolution Chart

Period options:

Daily.
Weekly.
Monthly.
Yearly.

Example:

January

February

March

April
9. Expense Analytics

The dashboard must show:

Expense distribution by category:

Examples:

Materials

Transport

Salaries

Maintenance

Equipment
10. Profit Analysis

The system must display:

Profit Trend

Showing:

Increasing profit.
Decreasing profit.
Loss periods.
Profit By Project

Example:

Project A

Profit:
450,000 DZD


Project B

Profit:
220,000 DZD
11. Inventory Dashboard

The inventory section must display:

Stock Overview
Total Products

Total Stock Value

Low Stock Items

Out of Stock Items
12. Stock Alerts

The system must generate notifications:

Examples:

WARNING:

Epoxy Resin stock is below minimum level.


WARNING:

Primer unavailable.
13. Customer Analytics

The dashboard must display:

Customer Statistics
Total Customers

New Customers

Top Customers

Customer Revenue
14. Supplier Analytics

Display:

Main suppliers.
Purchase volume.
Supplier payments.
Outstanding balances.
15. Global Search System

The ERP must provide a powerful global search.

Users can search:

Customers
Name.
Phone.
Registration number.
Projects
Code.
Name.
Client.
Documents
File name.
Financial Records
Invoice number.
Payment reference.
16. Notification Center

The system must include a notification system.

Notification types:

Financial Notifications

Examples:

Invoice overdue.

Payment received.

VAT deadline approaching.
Project Notifications

Examples:

Project deadline approaching.

Material shortage.

Project cost exceeded budget.
Inventory Notifications

Examples:

Low stock.

Missing material.
17. Calendar Module

The dashboard must include an operational calendar.

Events:

Project deadlines.
Customer meetings.
Payments due.
Maintenance dates.
Employee schedules.
18. Charts & Visualization

Recommended libraries:

Frontend:

Chart.js
Recharts

Required charts:

Line Charts

For:

Revenue evolution.
Profit evolution.
Bar Charts

For:

Sales comparison.
Expenses.
Pie Charts

For:

Expense categories.
Product categories.
19. Business Intelligence Reports

The system must generate:

Management Report

Contains:

Revenue.
Expenses.
Profit.
Projects.
Project Analysis Report

Contains:

Cost.
Materials.
Labor.
Profit.
Inventory Analysis Report

Contains:

Consumption.
Stock value.
Waste.
20. Dashboard API Requirements
Statistics API
GET /api/dashboard/statistics

Returns:

{
 revenue: 0,
 expenses: 0,
 profit: 0,
 projects: 0
}
Charts API
GET /api/dashboard/charts
Notifications API
GET /api/notifications
21. Business Rules

The dashboard must:

✓ Display real database data only.
✓ Update automatically.
✓ Respect user permissions.
✓ Support date filtering.
✓ Support export to PDF/Excel.
✓ Work on desktop and mobile.

22. Quality Checklist

Before completion:

✓ Dashboard connected to backend
✓ KPIs calculated correctly
✓ Charts display real data
✓ Notifications working
✓ Search system working
✓ Role-based views implemented
✓ Mobile responsive verified

IDEAIL ERP
Executive Technical Specification
Batch 8/10
UI/UX Design, Responsive Interface & Multilingual System Specification
1. Module Overview

The IDEAIL ERP interface must provide a modern, professional, and easy-to-use experience for all company users.

The design must follow modern ERP application standards while remaining simple for daily business operations.

The interface must support:

Desktop computers.
Tablets.
Smartphones.
Multiple languages.
Different user roles.
2. UI/UX Design Objectives

The interface must be:

Modern

Using:

Clean layouts.
Professional colors.
Clear typography.
Modern components.
Simple

Users must quickly access:

Customers.
Projects.
Inventory.
Finance.
Reports.
Fast

The system must minimize:

Unnecessary clicks.
Complex forms.
Repeated data entry.
Responsive

The same application must work correctly on:

Large screens.
Laptops.
Tablets.
Mobile phones.
3. Frontend Technology Requirements

The interface must use:

Framework

React.js

UI Library

Material UI (MUI)

Required components:

Tables.
Forms.
Dialogs.
Buttons.
Cards.
Menus.
Navigation.
Alerts.
4. Application Layout

The main layout should contain:

------------------------------------------------

LOGO + COMPANY NAME

------------------------------------------------

SIDEBAR        MAIN CONTENT AREA

Menu           Dashboard

               Pages

               Forms

               Reports


------------------------------------------------

Footer / System Information

------------------------------------------------
5. Main Navigation Menu

The sidebar must include:

Dashboard

Clients

Suppliers

Employees

Projects

Materials

Stock

Vehicles

Quotations

Invoices

Payments

Expenses

Reports

Documents

Settings
6. Dashboard Design

The dashboard must use:

KPI Cards

Examples:

Revenue

Expenses

Profit

Active Projects

Pending Payments

Stock Alerts
Data Visualization

Charts:

Sales evolution.
Profit evolution.
Expenses.
Project status.
7. Forms Design Standards

All forms must follow:

Clear Structure

Grouped sections:

Example:

Client Information

------------------

Company Details

------------------

Contact Information

------------------

Documents
Validation

Forms must provide:

Required field validation.
Error messages.
Input formatting.

Example:

Company Name *

Phone Number *

Email
8. Tables Design Standards

All data tables must include:

Pagination.
Search.
Sorting.
Filtering.
Export.
Actions menu.

Example:

-------------------------------------------------

Name | Phone | Status | Actions

-------------------------------------------------

ABC  | 0555  | Active | Edit/Delete

-------------------------------------------------
9. Mobile Responsive Design

The system must automatically adapt.

Desktop View

Full:

Sidebar.
Tables.
Multiple columns.
Tablet View

Optimized:

Collapsible menu.
Reduced columns.
Mobile View

Optimized:

Mobile navigation.
Cards instead of large tables.
Touch-friendly buttons.
10. Theme System

The application should support:

Light Mode

Default professional interface.

Dark Mode

Optional future feature.

11. Color & Branding

The interface must follow IDEAIL company branding.

Requirements:

Professional appearance.
Industrial/business style.
Consistent colors.
Clear status indicators.

Examples:

Success  → Completed

Warning  → Attention

Error    → Problem

Info     → Information
12. Multilingual System

The application must support:

French.
Arabic.
English.

Using:

i18next

13. Language Structure

Frontend structure:

languages/

├── fr/

│   └── translation.json


├── ar/

│   └── translation.json


└── en/

    └── translation.json
14. Arabic RTL Support

When Arabic language is selected:

The system must automatically switch to:

Right-to-left layout.

Changes include:

Menu direction.
Text alignment.
Form direction.
Table direction.
Icons positioning.

Example:

French:

Menu → Left Side

Arabic:

Menu → Right Side
15. Document & PDF Language Support

Generated documents must support:

Arabic.
French.
English.

Examples:

Quotations.
Invoices.
Reports.
Contracts.
16. User Experience Features

The system should include:

Notifications

Examples:

Payment received.
Stock low.
Project delayed.
Confirmation Dialogs

Before important actions:

Example:

"Are you sure you want to delete this record?"

Loading States

Display:

Loading indicators.
Progress feedback.
Error Handling

Display clear messages:

Example:

"Unable to save data. Please check required fields."

17. Accessibility Requirements

The interface should consider:

Readable fonts.
Clear contrast.
Keyboard navigation.
Touch-friendly controls.
18. Component Architecture

Reusable components must be created:

Example:

components/

├── DataTable

├── SearchBar

├── FormDialog

├── ConfirmDialog

├── FileUploader

├── DatePicker

├── StatusBadge

└── DashboardCard
19. Design Consistency Rules

All modules must use the same:

Buttons.
Forms.
Tables.
Colors.
Spacing.
Typography.

No module should have a different design style.

20. UI Testing Requirements

Before completion:

✓ Desktop tested
✓ Tablet tested
✓ Mobile tested
✓ Arabic RTL tested
✓ French tested
✓ English tested
✓ Forms validated
✓ Navigation verified
✓ No visual errors

IDEAIL ERP
Executive Technical Specification
Batch 9/10
Security, Backup, Deployment & System Administration Specification
1. Module Overview

The Security and System Administration Module ensures that IDEAIL ERP operates in a secure, reliable, and controlled environment.

The system must protect:

Company information.
Financial data.
Customer data.
Project information.
Employee records.

The security architecture must support both:

Local company installation.
Future cloud deployment.
2. Security Objectives

The system must provide:

Secure user authentication.
Role-based access control.
Activity monitoring.
Data protection.
Backup and recovery.
System logs.
3. Authentication System

The ERP must use:

JWT Authentication

JSON Web Token based authentication.

Authentication flow:

User Login

↓

Username + Password

↓

Server Verification

↓

JWT Token Generated

↓

Access Granted
4. Password Security

Passwords must never be stored as plain text.

Required technology:

bcrypt password hashing

Example:

Original Password

↓

bcrypt Hash

↓

Stored in Database
5. User Session Management

The system must manage:

Login sessions.
Token expiration.
Logout.
Unauthorized access prevention.
6. Role-Based Access Control (RBAC)

Each user must have specific permissions.

Administrator

Full access:

All modules.
User management.
Settings.
Reports.
Accountant

Access:

Quotations.
Invoices.
Payments.
Expenses.
Financial reports.
Project Manager

Access:

Projects.
Materials.
Employees.
Project reports.
Storekeeper

Access:

Products.
Stock.
Material movements.
Employee

Limited access:

Assigned tasks.
Assigned project information.
7. Permission Structure

The system must support permissions by module.

Example:

Module: Clients

Create     ✓

Read       ✓

Update     ✓

Delete     ✗
8. Audit Log System

The ERP must record important actions.

Table: logs
id

user_id

action

module

record_id

old_value

new_value

ip_address

date
9. Logged Activities

Examples:

User created a client

User modified an invoice

User deleted a product

User changed payment status

User logged into system
10. Data Protection

The system must protect:

Customer information.
Financial information.
Employee documents.

Required measures:

Secure API communication.
Input validation.
SQL injection prevention.
Access control.
11. File Management Security

Uploaded files must be protected.

Files include:

Contracts.
Project photos.
Employee documents.
Invoices.

Storage:

uploads/

├── clients/

├── projects/

├── employees/

├── suppliers/

└── documents/
12. Backup Strategy

The ERP must provide automatic and manual backup.

13. Database Backup

Supported:

SQLite Backup

For local installations.

PostgreSQL Backup

For production servers.

14. Backup Options

The system must support:

Manual Backup

Administrator can create backup anytime.

Automatic Backup

Scheduled backups:

Examples:

Daily

Weekly

Monthly
15. Backup Storage

Backup locations:

Local server.
External drive.
Cloud storage (future).
16. Restore System

The system must allow:

Database restoration.
Backup verification.
Recovery after failure.
17. Error Logging System

The backend must maintain technical logs.

Examples:

API Errors

Database Errors

Authentication Errors

System Failures
18. Deployment Architecture

The system must support two deployment modes.

Mode 1 — Local Deployment

For company office use.

Architecture:

Computer Server

↓

IDEAIL ERP Backend

↓

Database

↓

Office Users
Mode 2 — Cloud Deployment

Future expansion.

Architecture:

Cloud Server

↓

Backend API

↓

PostgreSQL Database

↓

Users Anywhere
19. Environment Configuration

The project must separate:

Development
.env.development
Production
.env.production

Configuration includes:

Database settings.
JWT secret.
Server ports.
File storage paths.
20. API Security Requirements

The backend must implement:

Request validation.
Authentication middleware.
Authorization middleware.
Rate limiting.
Error handling.
21. System Administration Panel

The administrator panel must include:

User Management
Create users.
Disable users.
Change roles.
System Settings
Company information.
Logo.
Language.
Currency.
VAT settings.
Backup Management
Create backup.
Restore backup.
View backup history.
22. Monitoring

The system should provide:

Server status.
Database status.
Storage usage.
Error monitoring.
23. Security Testing Requirements

Before deployment:

✓ Authentication tested
✓ Permissions tested
✓ Password encryption verified
✓ SQL injection protection tested
✓ Backup tested
✓ Restore tested
✓ Logs verified
✓ File security verified

24. Production Readiness Checklist

The system is ready for production when:

✓ Security implemented
✓ Backup operational
✓ Database stable
✓ User roles configured
✓ Logs active
✓ Deployment documented
✓ Recovery procedure tested

IDEAIL ERP
Executive Technical Specification
Batch 10/10
Final Implementation Roadmap & Delivery Plan
1. Project Implementation Overview

The IDEAIL ERP project must be developed using a structured implementation approach.

The development team must prioritize:

Stability.
Real business functionality.
Data accuracy.
User experience.
Future scalability.

The ERP must be delivered as a complete operational system, not as a prototype.

2. Development Strategy

The implementation must follow progressive phases:

Phase 1

Foundation & Core System


↓

Phase 2

Master Data Modules


↓

Phase 3

Project Management


↓

Phase 4

Inventory & Materials


↓

Phase 5

Financial Management


↓

Phase 6

Dashboard & Reports


↓

Phase 7

Security & Deployment


↓

Phase 8

Final Testing & Production
PHASE 1
System Foundation
Objectives

Build the technical foundation.

Tasks:

Configure frontend React application.
Configure backend Node.js API.
Configure database.
Create project structure.
Implement authentication.

Deliverables:

✓ Working frontend
✓ Working backend
✓ Database connection
✓ User login system

PHASE 2
Master Data Modules

Modules:

Users.
Clients.
Suppliers.
Employees.
Products.

Tasks:

Database tables.
API development.
Frontend pages.
CRUD operations.
Validation.

Deliverables:

✓ Complete master data management.

PHASE 3
Project Management Module

Priority module for IDEAIL business.

Tasks:

Project creation.
Client connection.
Technical system selection.
Material planning.
Employee assignment.
Expense tracking.
Cost calculation.

Deliverables:

✓ Complete project lifecycle management.

PHASE 4
Inventory & Materials Module

Tasks:

Product management.
Categories.
Stock movements.
Purchases.
Consumption tracking.

Special requirements:

Resin consumption calculation.
Epoxy material tracking.
Waste monitoring.

Deliverables:

✓ Real-time inventory control.

PHASE 5
Financial Module

Tasks:

Quotations.
Invoices.
Payments.
Expenses.
Debts.
VAT.

Deliverables:

✓ Complete financial management.

PHASE 6
Dashboard & Business Intelligence

Tasks:

KPI cards.
Charts.
Reports.
Notifications.
Statistics.

Deliverables:

✓ Executive management dashboard.

PHASE 7
Security & Deployment

Tasks:

User permissions.
Audit logs.
Backup system.
Production configuration.

Deliverables:

✓ Secure production-ready ERP.

PHASE 8
Testing & Final Delivery
3. Testing Strategy

Every module must pass:

Functional Testing

Verify:

Create.
Read.
Update.
Delete.
Search.
Export.
Integration Testing

Verify:

Examples:

Project

↓

Materials

↓

Stock

↓

Cost

↓

Profit
User Acceptance Testing (UAT)

Real users must verify:

Ease of use.
Data accuracy.
Workflow correctness.
4. Final System Acceptance Criteria

The ERP is accepted only when:

Technical Requirements

✓ Frontend working
✓ Backend working
✓ Database stable
✓ API complete
✓ Security implemented

Business Requirements

✓ Clients managed
✓ Suppliers managed
✓ Employees managed
✓ Projects managed
✓ Inventory controlled
✓ Financial operations completed

Reporting Requirements

✓ Dashboard available
✓ Financial reports generated
✓ Project profitability calculated
✓ VAT reports available

5. Performance Requirements

The system must provide:

Fast page loading.
Efficient database queries.
Smooth navigation.
Reliable operation with multiple users.
6. Future Expansion Roadmap

The architecture must allow future features:

Mobile Application

Android / iOS application.

Cloud SaaS Version

Online ERP access.

Advanced Accounting

Complete Algerian accounting integration.

Artificial Intelligence Features

Future possibilities:

Automatic cost prediction.
Material consumption prediction.
Project profitability analysis.
Intelligent recommendations.
Multi-Company Support

Future capability:

Multiple companies.
Multiple branches.
Central management.
7. Developer Final Instructions

The development team must:

Build real production functionality.
Avoid demo data.
Avoid incomplete placeholders.
Connect all interfaces to the real database.
Maintain clean and documented code.
Follow the defined architecture.
Test every module before delivery.
8. Final Project Vision

IDEAIL ERP must become the central digital platform for SARL IDEAIL ROUVETMON.

The final system must allow the company to:

Manage all projects professionally.
Control materials and costs.
Monitor financial performance.
Reduce administrative workload.
Improve profitability.
Prepare the company for future growth.