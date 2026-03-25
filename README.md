# VotoSphere — Scalable Polling & Election Management System

VotoSphere is a professional, full-stack RESTful API and web application designed for secure and scalable polling. Built with the MERN stack (MongoDB, Express, Node.js), it features robust authentication, Role-Based Access Control (RBAC), and detailed audit logging.

## 🚀 Key Features

- **Advanced Authentication**: JWT-based auth with secure password hashing and OTP email verification.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Admins and Voters.
- **Poll Management**: Full CRUD operations for elections and candidates.
- **Secure Voting**: One-vote-per-election enforcement with cryptographic vote receipts.
- **Data Export**: Export election results and voter lists in CSV and professional PDF formats.
- **Audit Logging**: Comprehensive tracking of administrative actions for transparency.
- **Security First**: Rate limiting on sensitive endpoints and input validation.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Frontend**: React.js, Vite, Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Communication**: Nodemailer (OTP Verification)
- **Reporting**: PDFKit (Professional PDF Generation)

## 📦 Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- SMTP Server (e.g., Gmail/Mailtrap for OTP)

### 1. Clone & Install
```bash
git clone <repository-url>
cd Voting_app

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `backend` directory:
```env
PORT=3000
MONGODB_URL=mongodb://localhost:27017/voting-app
JWT_SECRET=your_super_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Run the Application
**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd client
npm run dev
```

## 🔌 API Documentation

- **Base URL**: `http://localhost:3000/api/v1`
- **Auth Strategy**: Bearer Token in `Authorization` header.

Full API documentation can be found in [API_Documentation.md](./API_Documentation.md).

## 📈 Scalability Section

VoteApp is designed with scalability in mind:
- **Microservices Ready**: The modular route structure allows for easy extraction of the Audit or Election services into independent microservices.
- **Redis Caching**: Planned integration for caching poll results to handle high-concurrency read traffic during live elections.
- **Load Balancing**: Stateless JWT authentication enables easy horizontal scaling across multiple server instances.
- **Dockerization**: Ready for containerization with Docker and orchestration via Kubernetes.

## 📄 Postman Usage
1. Import the provided `Postman_Collection.json` (or manually configure using `API_Documentation.md`).
2. Register/Login to receive a JWT token.
3. Add the token to the `Authorization` tab as `Bearer Token` for protected routes.
