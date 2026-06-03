# DESC Citizen Portal — MERN Stack

A full-stack citizen services portal for the District Emergency Services Command (DESC) Mardan, KPK. Citizens can submit service requests, track their status, and manage their profiles. Admins can review, update, and manage all requests.

---

## 🗂 Project Structure

```
desc-portal/
├── backend/                  # Node.js + Express API
│   ├── models/
│   │   ├── User.js           # Citizen & Admin user schema
│   │   └── ServiceRequest.js # Request schema with timeline
│   ├── routes/
│   │   ├── auth.js           # Register, login, profile
│   │   ├── requests.js       # Citizen request CRUD
│   │   ├── admin.js          # Admin management routes
│   │   └── users.js          # User profile helpers
│   ├── middleware/
│   │   └── auth.js           # JWT protect + adminOnly
│   ├── uploads/              # File attachment storage
│   ├── server.js             # Express app entry
│   ├── seed.js               # Demo data seeder
│   └── .env                  # Environment variables
│
├── frontend/                 # React 18 app
│   └── src/
│       ├── context/
│       │   └── AuthContext.js      # JWT auth state
│       ├── components/
│       │   ├── layout/
│       │   │   └── AppLayout.js    # Sidebar + topbar shell
│       │   └── common/
│       │       └── StatusBadge.js  # Status & priority chips
│       └── pages/
│           ├── LoginPage.js
│           ├── RegisterPage.js
│           ├── HomePage.js
│           ├── CitizenDashboard.js
│           ├── SubmitRequest.js
│           ├── RequestTracking.js
│           ├── RequestDetail.js
│           ├── AdminDashboard.js
│           ├── AdminRequestDetail.js
│           ├── ProfilePage.js
│           └── NotFound.js
│
└── package.json              # Root scripts (concurrently)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 1. Install Dependencies

```bash
# From root directory
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/desc_portal
JWT_SECRET=desc_portal_super_secret_jwt_key_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Seed Demo Data

```bash
npm run seed
```

This creates:
- **Admin:** `admin@desc.gov.pk` / `admin123`
- **Citizen:** `ahmed@example.com` / `citizen123`
- **Citizen:** `fatima@example.com` / `citizen123`
- 20 sample service requests with various statuses

### 4. Run Development Servers

```bash
# Run both backend and frontend together
npm run dev
```

Or separately:
```bash
npm run dev:backend   # Backend on http://localhost:5000
npm run dev:frontend  # Frontend on http://localhost:3000
```

---

## 🔑 Features

### Citizen Portal
| Feature | Description |
|---|---|
| Register / Login | JWT-based auth with secure passwords |
| Home Page | Service categories, quick actions, info banner |
| Dashboard | Stats overview (total, active, resolved), recent requests |
| Submit Request | Multi-step form with service type, applicant info, location, file attachments |
| Track Status | Filterable list by status, searchable by ID or subject |
| Request Detail | Full details, timeline history, admin notes |
| Profile | Edit personal info, change password |

### Admin Portal
| Feature | Description |
|---|---|
| Dashboard | Stats (total, pending, resolved, citizens), resolution rate |
| Requests Table | Searchable, filterable by status/priority, paginated |
| Request Review | View full citizen details, update status, add admin notes |
| Status Workflow | submitted → in_review → pending_info → approved/rejected → resolved |
| Timeline Tracking | Every status change logged with admin name and timestamp |

---

## 🎨 Design System

Follows the **DESC Design System** with:
- **Primary:** `#002045` (DESC Navy)
- **Font:** Inter (all weights)
- **Components:** Cards, status badges, input fields, nav links — all using Tailwind CSS with custom design tokens
- **Responsive:** Mobile-first with collapsible sidebar and bottom navigation

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new citizen |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Citizen Requests
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/requests` | Get own requests (filterable) |
| GET | `/api/requests/stats` | Get request stats |
| GET | `/api/requests/:id` | Get single request |
| POST | `/api/requests` | Submit new request (multipart) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/requests` | All requests (searchable) |
| GET | `/api/admin/requests/:id` | Single request detail |
| PUT | `/api/admin/requests/:id/status` | Update request status |
| GET | `/api/admin/citizens` | All citizens list |

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios, React Hot Toast |
| Backend | Node.js, Express.js, JWT, bcryptjs, Multer, express-validator |
| Database | MongoDB with Mongoose ODM |
| Dev Tools | Nodemon, Concurrently |
