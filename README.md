Online Equipment Borrowing and Return Monitoring System
Course: Systems Analysis and Design — Laboratory Exercise 3-3B
Name: Hans Christian
Section: BSIT Section B
Stack: HTML / CSS / Vanilla JavaScript · Supabase (PostgreSQL + Auth) · GitHub Pages
---
I. Problem Statement
The College currently records equipment borrowing manually, using logbooks or spreadsheets. This makes it hard for the Equipment Custodian to know which items are borrowed, who has them, when they are due, and whether any are overdue. Manual tracking is affected by human error, lost records, and delayed follow-up on unreturned items, which leads to missing or damaged equipment and disputes over accountability. This system replaces the manual log with a centralized, authenticated web application that records every borrowing and return transaction in real time, automatically flags overdue items, and gives the custodian an at-a-glance dashboard of equipment status.
II. Actors
Actor	Role
System User / Equipment Custodian	Logs in, manages equipment records, records borrowing and return transactions, monitors the dashboard
Borrower (Student / Faculty / Staff)	Indirect actor — their information is recorded by the System User during a transaction; does not log in directly
III. Use Case Diagram (textual)
```
System User / Equipment Custodian
│
├── Login
├── View Dashboard
├── Manage Equipment
│   ├── Add Equipment
│   ├── View Equipment
│   ├── Edit Equipment
│   └── Delete Equipment
├── Record Borrowing Transaction
├── View Transactions
├── Return Equipment
├── Search Equipment / Transactions
├── Filter Equipment / Transactions
└── Logout
```
(Render this as a proper UML use-case diagram — e.g. in draw.io — and export to `documentation/use-case.png`.)
IV. Entity-Relationship Diagram
```
EQUIPMENT (1) ────────< (M) BORROW_TRANSACTIONS
   PK id                     PK id
   equipment_name            FK equipment_id
   category                  borrower_name
   asset_code                borrower_type
   condition                 department
   availability              date_borrowed
                             due_date
                             date_returned
                             status
                             user_id
```
Relationship: One equipment item may appear in many borrowing transactions over its lifetime (e.g. the same projector is borrowed and returned repeatedly), but each borrowing transaction refers to exactly one equipment item — a one-to-many relationship from `equipment` to `borrow_transactions`, enforced by the `equipment_id` foreign key.
(Export a visual ERD to `documentation/erd.png`.)
---
V. Project Structure
```
SAD-EquipmentBorrowing-Lastname/
├── index.html              # Dashboard, equipment & transaction modules
├── login.html              # Authentication page
├── css/
│   └── style.css
├── js/
│   ├── supabase.js         # Supabase client config
│   ├── auth.js             # Login / logout / session guard
│   ├── equipment.js        # Equipment CRUD, search, filter
│   ├── transactions.js     # Borrowing, return, overdue logic, dashboard
│   └── ui.js                # Toasts, confirm modal, tab switching
├── documentation/
│   ├── schema.sql          # Table creation + Row Level Security policies
│   ├── use-case.png        # (add your diagram)
│   └── erd.png             # (add your diagram)
└── README.md
```
VI. Setup Instructions
Create a Supabase project at supabase.com.
Open the SQL Editor and run `documentation/schema.sql` to create the `equipment` and `borrow_transactions` tables with Row Level Security enabled.
Go to Authentication → Users and manually add at least one user account (email + password) for the System User / Equipment Custodian — this lab does not include self-service signup.
Go to Project Settings → API and copy your Project URL and anon public key.
Open `js/supabase.js` and paste them in:
```js
   const SUPABASE_URL = "https://xxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "your-anon-key";
   ```
Open `login.html` in a browser (or serve the folder with any static server) and log in with the account created in step 3.
VII. Deployment (GitHub Pages)
Create a repository named `SAD-EquipmentBorrowing-Lastname`.
Push the full project with at least four meaningful commits, e.g.:
`Initial equipment borrowing system structure`
`Create Supabase equipment database integration`
`Implement borrowing and return transaction logic`
`Add overdue detection and deploy application`
In Settings → Pages, deploy from the `main` branch, root folder.
Live system will be available at:
`https://username.github.io/SAD-EquipmentBorrowing-Lastname/`
---
VIII. Business Rules Implemented
ID	Rule	Where enforced
BR-01	Equipment name cannot be empty	`equipment.js` form validation
BR-02	Asset code must be unique	`equipment.js` client check + DB `UNIQUE` constraint
BR-03	Only available equipment may be borrowed	`transactions.js`, dropdown only lists Available items
BR-04	Borrower name must be provided	`transactions.js` form validation
BR-05	Due date cannot be earlier than borrowing date	`transactions.js` form validation
BR-06	Newly borrowed equipment receives Borrowed status	`transactions.js` insert logic
BR-07	Borrowed equipment becomes unavailable	`transactions.js` updates `equipment.availability`
BR-08	Returned equipment becomes available again	`transactions.js` return logic
BR-09	Equipment past due date is identified as Overdue	`transactions.js` `fetchTransactions()` date check
BR-10	Deletion requires user confirmation	`ui.js` confirm modal used by `equipment.js`
BR-11	Only authenticated users may manage records	`auth.js` session guard + Supabase RLS policies
BR-12	A returned transaction cannot be returned a second time	`transactions.js` `confirmReturnEquipment()`
IX. Requirements Traceability Matrix
Requirement	Feature	Test
FR-01	User Login	TC-01
FR-02	Add Equipment	TC-02
FR-03	Edit Equipment	TC-03
FR-04	Delete Equipment	TC-04
FR-05	Record Borrowing	TC-05
FR-06	Return Equipment	TC-06
FR-07	Detect Overdue	TC-07
FR-08	Search Records	TC-08
FR-09	Filter Records	TC-09
FR-10	Dashboard Summary	TC-10
X. Functional Testing
Test ID	Test Scenario	Expected Result	Result
TC-01	Login with valid account	Dashboard displayed	PASS / FAIL
TC-02	Add equipment	Record successfully saved	PASS / FAIL
TC-03	Edit equipment	Changes displayed	PASS / FAIL
TC-04	Delete equipment	Confirmation shown before deletion	PASS / FAIL
TC-05	Borrow available equipment	Transaction saved and equipment becomes Borrowed	PASS / FAIL
TC-06	Return equipment	Transaction becomes Returned and equipment becomes Available	PASS / FAIL
TC-07	View late borrowing	Record displayed as Overdue	PASS / FAIL
TC-08	Search borrower	Matching transactions displayed	PASS / FAIL
TC-09	Filter Borrowed status	Only Borrowed transactions displayed	PASS / FAIL
TC-10	Open deployment URL	System accessible online	PASS / FAIL
(Fill in PASS/FAIL after testing on your deployed system, and attach screenshots.)
XI. Optional Challenge — Equipment Borrowing History
Implemented in `transactions.js` as `showEquipmentHistory(equipmentId, equipmentLabel)`, which queries `borrow_transactions` filtered by `equipment_id` directly from Supabase (no hard-coded data). To wire it into the UI, call it from an equipment row's name, e.g.:
```html
<td onclick="showEquipmentHistory(${eq.id}, '${escapeHtml(eq.equipment_name)}')">${escapeHtml(eq.equipment_name)}</td>
```
---
Submission Checklist
[ ] GitHub repository URL
[ ] GitHub Pages live system URL
[ ] README documentation (this file)
[ ] Use Case Diagram (`documentation/use-case.png`)
[ ] ERD (`documentation/erd.png`)
[ ] Requirements Traceability Matrix (Section IX)
[ ] Screenshots of the running system
[ ] Functional testing results (Section X)
'''
'''
Login credentials
Email: admin@gmail.com
password: 12345
