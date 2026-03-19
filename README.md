# 🗳️ VotoSphere — Voting Application

A full-stack voting system featuring a **React + Vite** frontend and a **Node.js + Express** backend. The application manages user registration (with OTP verification), secure voting, and admin-led election management.

---

## 📁 Project Structure

```
Voting_app/
├── backend/                 # Node.js + Express Server
│   ├── server.js            # Entry point (port 3000)
│   ├── db.js                # MongoDB connection
│   ├── jwt.js               # Auth middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoints
│   ├── uploads/             # Static assets (symbols, photos)
│   └── .env                 # Environment variables
├── client/                  # React + Vite Frontend
│   ├── src/                 # Source code
│   └── vite.config.js       # Vite configuration (proxy to port 3000)
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env with MONGODB_URL, JWT_SECRET, EMAIL_USER, EMAIL_PASS
npm start
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🛠️ Features
- **OTP Verification**: Secure registration via email OTP.
- **Role-Based Access**: Separate dashboards for voters and admins.
- **Election Management**: Admins can create and manage candidates/elections.
- **Secure Voting**: One-vote-per-election policy with cryptographic vote receipts.
- **Audit Logs**: Tracking administrative actions for transparency.

---

## 📝 Author
**Priyanshu Choudhary**

