# ProcureHub — Phase 1 MVP

Enterprise e-Procurement Platform · React + FastAPI · Dark Navy/Teal UI

---

## 🗂 Project Structure

```
procurehub/
├── backend/                  # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py           # App entry point, CORS, routers
│   │   ├── core/
│   │   │   ├── config.py     # Env settings (DATABASE_URL, SECRET_KEY)
│   │   │   ├── database.py   # SQLAlchemy engine + session
│   │   │   └── security.py   # JWT auth, password hashing, RBAC
│   │   ├── models/
│   │   │   ├── user.py       # User + UserRole enum
│   │   │   ├── vendor.py     # Vendor, VendorStatus, VendorCategory
│   │   │   └── procurement.py # PR, PRLineItem, PO, POLineItem
│   │   ├── schemas/
│   │   │   ├── auth.py       # Pydantic schemas for auth
│   │   │   ├── vendor.py     # Vendor request/response schemas
│   │   │   └── procurement.py # PR + PO request/response schemas
│   │   └── routers/
│   │       ├── auth.py       # /api/auth — login, register, me
│   │       ├── vendors.py    # /api/vendors — CRUD + status
│   │       ├── requisitions.py # /api/requisitions — PR lifecycle
│   │       └── purchase_orders.py # /api/purchase-orders — PO CRUD
│   ├── seed.py               # Bootstrap admin user + sample data
│   └── requirements.txt
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── api/client.js     # Axios instance + per-module API helpers
    │   ├── store/
    │   │   ├── authStore.js  # Zustand auth state (login/logout/token)
    │   │   └── toastStore.js # Global toast notifications
    │   ├── components/
    │   │   ├── auth/ProtectedRoute.jsx
    │   │   ├── shared/
    │   │   │   ├── AppLayout.jsx   # Sidebar + main content wrapper
    │   │   │   ├── Sidebar.jsx     # Nav with role-aware links
    │   │   │   └── ToastContainer.jsx
    │   │   └── vendor/VendorModal.jsx  # Tabbed create/edit form
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── Dashboard.jsx       # KPI stats + recent activity
    │   │   ├── VendorsPage.jsx     # List + search + approve/reject
    │   │   ├── RequisitionsPage.jsx # PR list + submit + approve
    │   │   ├── NewPRPage.jsx       # PR form with dynamic line items
    │   │   ├── PurchaseOrdersPage.jsx
    │   │   ├── NewPOPage.jsx       # PO form with GST calc + totals
    │   │   └── SettingsPage.jsx
    │   ├── styles/global.css   # Full design system (tokens, components)
    │   └── App.jsx             # BrowserRouter + route definitions
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

---

### Backend

```bash
cd procurehub/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Create .env for custom settings
echo "SECRET_KEY=your-secret-key-here" > .env
echo "DATABASE_URL=sqlite:///./procurehub.db" >> .env

# Seed database with sample data
python seed.py

# Start dev server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### Frontend

```bash
cd procurehub/frontend

# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev
```

Open: http://localhost:5173

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@procurehub.in | admin123 |
| Buyer | buyer@procurehub.in | buyer123 |

---

## 📋 Phase 1 Features (This Release)

### Auth & RBAC
- JWT-based authentication (8-hour tokens)
- Roles: `admin`, `procurement_manager`, `buyer`, `approver`, `vendor`
- Route-level protection in both frontend and backend
- Password hashing with bcrypt

### Vendor Management
- Full CRUD with vendor code auto-generation
- Fields: company, GSTIN, PAN, bank details, address, category
- Status workflow: Pending → Under Review → Approved / Rejected / Blacklisted
- Approve/reject directly from the list view
- Tabbed create/edit modal (Basic / Address / Banking)

### Purchase Requisitions
- Create PR with dynamic line items
- Auto-calculated estimated value
- Priority levels: Low / Medium / High / Critical
- Status flow: Draft → Submitted → Approved → PO Created
- Submit, approve inline from list
- Role-based actions (only approvers/managers can approve)

### Purchase Orders
- Create PO against approved vendors
- Pre-fill line items from linked PR
- Indian GST rates (0%, 5%, 12%, 18%, 28%) per line item
- Auto-calculated subtotal, GST, and total in INR
- Status flow: Draft → Sent → Acknowledged → Received → Closed
- HSN code field per line item

### Dashboard
- Live KPI cards: PR count, active POs, vendor count, total PO value
- Pending approval alert banner
- Recent requisitions + vendor pipeline widgets

---

## 🔜 Phase 2 (Q3–Q4 2025)
- RFQ / multi-vendor sourcing
- Three-way matching (PO–GRN–Invoice)
- Invoice management + payment runs
- Vendor risk scoring
- SAP MM/SD connector
- Audit trail & SOX export

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router v6, Zustand, Axios |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic v2, python-jose |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Auth | JWT Bearer tokens, bcrypt |
| UI | IBM Plex Sans/Mono, custom CSS design system |

---

## 🚀 Production Checklist
- [ ] Replace SQLite with PostgreSQL: update `DATABASE_URL` in `.env`
- [ ] Set strong `SECRET_KEY` (use `openssl rand -hex 32`)
- [ ] Run `alembic init` and set up migrations
- [ ] Add HTTPS / reverse proxy (nginx)
- [ ] Set `allow_origins` in CORS to your actual domain
- [ ] Build frontend: `npm run build` → serve `/dist`
