# 🗳️ VotoSphere — Secure Digital Voting Platform

VotoSphere is a state-of-the-art, full-stack voting system designed for security, transparency, and ease of use. It leverages a **MERN stack** (MongoDB, Express, React, Node) to provide a robust platform for both voters and administrators.

---

## 🌟 Key Features

### 🔐 Security & Authentication
- **Identity Verification**: Multi-step registration requiring a unique Aadhar ID.
- **Email OTP**: 6-digit one-time password verification for all new accounts.
- **JWT-Based Auth**: Secure, stateless session management with JSON Web Tokens.
- **Role-Based Access (RBAC)**: Distinct dashboards and permissions for Voters and Admins.

### 🗳️ Voting Experience
- **Targeted Eligibility**: Admins can specify exactly which voters are eligible for each election.
- **One-Vote-Per-Election**: Strict enforcement to ensure fairness.
- **Vote Receipts**: Secure, downloadable PDF receipts for every vote cast.
- **Live Results**: Real-time vote counting with results locked until election completion.

### 🛡️ Administrative Control
- **Election Management**: Full CRUD operations for elections and candidates.
- **Audit Logs**: Comprehensive tracking of all administrative actions for accountability.
- **Voter Turnout Analysis**: Detailed statistics on participation and voting timelines.

---

## 🚀 Tech Stack

### Frontend
- **React 19** + **Vite**
- **Tailwind CSS v4** (Modern Utility-First Styling)
- **Framer Motion** (Smooth UI Animations)
- **Lucide React** (Clean SVG Icons)
- **React Router DOM v7**

### Backend
- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **PDFKit** (Secure Receipt Generation)
- **Nodemailer** (Email Services)
- **Bcrypt** (Password Hashing)

---

## 📂 Project Structure

```bash
Voting_app/
├── backend/                 # Node.js + Express API
│   ├── server.js            # Entry point
│   ├── models/              # Mongoose Schemas (User, Election, Candidate, AuditLog)
│   ├── routes/              # RESTful API Endpoints
│   └── uploads/             # Static Assets (Candidate Symbols)
├── client/                  # React + Vite UI
│   ├── src/                 # Application Source
│   │   ├── components/      # Reusable UI Elements (Navbar, Modals, etc.)
│   │   ├── pages/           # View Components (Dashboard, Results, Profile)
│   │   └── context/         # Auth & Global State
└── PROJECT_DOCUMENTATION.md # Detailed technical specifications
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# MONGODB_URL=...
# JWT_SECRET=...
# EMAIL_USER=...
# EMAIL_PASS=...
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## 📝 Author
**Priyanshu Choudhary**

---

> [!NOTE]
> For a more detailed technical breakdown, system design, and future roadmap, please refer to the [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) file.
