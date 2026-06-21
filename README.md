# DESC Citizen Portal — MERN Stack

A full-stack citizen services portal for the District Emergency Services Command (DESC) Mardan, KPK. Citizens can submit service requests, track their status, and manage their profiles. Admins can review, update, and manage all requests.

---

## 🗂 Project Structure

```
desc-portal/
├── backend/                  # Node.js + Express API
│   ├── models/
│   │   ├── User.js           # Citizen & Admin user schema
│   │   ├── ServiceRequest.js # Request schema with timeline + feedback
│   │   └── Notification.js   # In-app notification schema
│   ├── routes/
│   │   ├── auth.js           # Register, login, profile
│   │   ├── requests.js       # Citizen request CRUD + feedback
│   │   ├── admin.js          # Admin management routes
│   │   ├── users.js          # User profile helpers
│   │   └── notifications.js  # List / mark-read notifications
│   ├── utils/
│   │   ├── socket.js         # Socket.IO + Redis adapter setup
│   │   ├── notify.js         # Create + emit notification helper
│   │   └── storage.js        # S3-compatible storage (attachments + avatars)
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
│       │   ├── AuthContext.js      # JWT auth state
│       │   └── SocketContext.js    # Live notification socket connection
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.js        # Sidebar + topbar shell
│       │   │   └── NotificationBell.js # Notification dropdown
│       │   └── common/
│       │       ├── StatusBadge.js  # Status & priority chips
│       │       ├── StarRating.js   # Editable / read-only star rating
│       │       └── FeedbackForm.js # Rating + comment submission
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
- **Redis** running locally (`redis://localhost:6379`) — backs real-time notifications via the Socket.IO Redis adapter (see "Real-Time Notifications" below). `docker run -p 6379:6379 redis:7-alpine` works fine for local dev.
- **MinIO** (or any S3-compatible storage) running locally — backs file attachments and avatars (see "File Storage" below). `docker run -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin123 minio/minio server /data --console-address ":9001"` works for local dev. The MinIO console (`http://localhost:9001`) is useful for browsing uploaded files directly.

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
REDIS_URL=redis://localhost:6379
S3_BUCKET=desc-portal-uploads
S3_REGION=ap-south-1
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
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
| **Notifications** | Real-time bell icon — new updates pushed instantly via Socket.IO, no refresh needed |
| **Feedback & Ratings** | Star rating + comment on resolved requests, visible to admins on the request detail page |

### Real-Time Notifications

Citizens and admins are notified instantly when:
- A citizen submits a new request → all admins get notified
- An admin changes a request's status → the citizen gets notified (and the open Request Detail page updates live, no refresh)
- A request is marked resolved → the citizen is prompted to leave feedback

This runs on Socket.IO with a **Redis adapter**. The backend runs multiple replicas behind a Service (see `k8s/hpa.yaml`, 2–5 pods), and Socket.IO's in-memory room registry is per-process — a notification fired from the pod handling an admin's request wouldn't reach a citizen's socket connected to a *different* pod. Redis pub/sub bridges that gap so every pod can broadcast to every connected client, regardless of which pod they're attached to. See `backend/utils/socket.js` for the implementation notes.

### File Storage

Request attachments and avatars are stored in **S3-compatible object storage**, not on local disk. This matters for the same reason Redis does: with multiple backend replicas, a file saved to one pod's local filesystem is invisible to every other pod. A citizen could upload a document, and a later request that happened to land on a different pod simply wouldn't find it.

The backend talks to storage through the standard AWS S3 API (`backend/utils/storage.js`), which means the exact same code works against two different backends depending on environment:
- **Local dev / Minikube**: points at **MinIO** (an open-source S3-compatible server) via `S3_ENDPOINT` + `S3_FORCE_PATH_STYLE=true`
- **Real cloud deployment**: leave `S3_ENDPOINT` unset and it talks to actual **AWS S3**, with credentials resolved from the instance/pod's IAM role instead of static keys

Buckets are private — files are never served from a permanent public URL. Every download link is a short-lived **signed URL**, generated fresh each time a request or profile is fetched (signing is a local cryptographic operation, not a network round-trip, so this doesn't add latency).

### Admin Portal
| Feature | Description |
|---|---|
| Dashboard | Stats (total, pending, resolved, citizens), resolution rate, **avg. citizen satisfaction rating** |
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
| POST | `/api/requests/:id/feedback` | Submit star rating + comment (resolved requests only) |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List own notifications (paginated) + unread count |
| PUT | `/api/notifications/:id/read` | Mark one notification read |
| PUT | `/api/notifications/read-all` | Mark all notifications read |

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
| Frontend | React 18, React Router v6, Tailwind CSS, Axios, React Hot Toast, Socket.IO Client |
| Backend | Node.js, Express.js, JWT, bcryptjs, Multer, express-validator, Socket.IO |
| Database | MongoDB with Mongoose ODM |
| Real-Time | Redis (Socket.IO adapter for multi-replica notification fan-out) |
| File Storage | S3-compatible object storage (MinIO locally / AWS S3 in production) |
| Dev Tools | Nodemon, Concurrently |
