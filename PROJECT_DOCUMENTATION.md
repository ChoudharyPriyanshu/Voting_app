# VotoSphere - Secure Digital Voting Platform

## Objective
VotoSphere is a secure, transparent, and user-friendly digital voting platform designed to streamline the election process. The primary goal is to ensure integrity and accessibility by leveraging modern web technologies and robust authentication mechanisms, providing a reliable alternative to traditional voting systems.

## Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4 (Vanilla CSS approach)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **Feedback**: React Hot Toast
- **State Management**: Context API (AuthContext)

### Backend
- **Environment**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Stateless JWT (JSON Web Tokens)
- **Security**: 
  - Bcrypt for password hashing
  - Express Rate Limit for brute-force protection
  - RBAC (Role-Based Access Control)
- **Verification**: Nodemailer for Email OTP verification
- **Reports**: PDFKit for generating secure vote receipts

## System Architecture & Design

### Architectural Pattern
VotoSphere follows a **Client-Server Architecture** with a clear separation of concerns:
- **Client (Frontend)**: A modern Single Page Application (SPA) that handles the UI/UX, client-side routing, and state management.
- **Server (Backend)**: A RESTful API that manages business logic, database interactions, authentication, and secure data processing.

### Database Design
- **User Model**: Stores identity details (Aadhar Card Number), contact info, hashed passwords, roles (voter/admin), and verification status (OTP-based).
- **Election Model**: Defines election metadata, start/end dates, status (upcoming/ongoing/completed), and a list of eligible voters.
- **Candidate Model**: Links candidates to specific elections and tracks live vote counts and voter timestamps.
- **Audit Log Model**: Records all administrative actions for transparency and accountability.

### Security Design
- **Identity Verification**: Users must provide a unique Aadhar Card Number and verify their email via a 6-digit OTP before they can participate.
- **One-Person-One-Vote**: The system strictly enforces a single vote per verified user per election.
- **Data Integrity**: Admin actions (creating/deleting elections) are logged in an immutable audit trail.
- **Rate Limiting**: Protects sensitive routes like login and signup from automated attacks.

## Project Workflow

1. **Administrative Setup**:
   - Admins can create new elections, defining their duration and selecting eligible voters from the verified user pool.
   - Admins manage the candidate list for each election.

2. **User Registration & Verification**:
   - New users sign up with their Aadhar ID and email.
   - They receive a one-time password (OTP) via email to verify their identity.
   - Once verified, they are assigned a unique Voter ID (or Admin ID).

3. **Voting Process**:
   - Verified voters see only the elections they are eligible for on their dashboard.
   - Users can safely cast their vote for their preferred candidate during the active election period.
   - Upon voting, the system generates a secure, downloadable **Vote Receipt** in PDF format.

4. **Results & Monitoring**:
   - Live results are updated in real-time but remain locked for general viewing until the election concludes.
   - Admins monitor the system through a dedicated dashboard and audit logs.

## Current Features
- [x] Secure OTP-based Signup & Verification
- [x] Role-Based Dashboards (Admin vs. Voter)
- [x] Comprehensive Election Management (CRUD)
- [x] Targeted Voter Eligibility
- [x] Live Results & Participation Statistics
- [x] Automated Audit Logging for Admins
- [x] Secure PDF Vote Receipt Generation
- [x] Profile Management & Password Security

## Future Roadmap & Potential Features
- **Blockchain Integration**: Implementing a decentralized ledger (e.g., Ethereum or Hyperledger) to make vote records completely immutable and publicly verifiable.
- **Real-time Analytics**: Interactive charts and heatmaps using D3.js or Chart.js for deeper insights into voter participation.
- **Biometric Authentication**: Adding fingerprint or facial recognition support for mobile devices.
- **Multlingual Support**: Translating the platform into regional languages to increase accessibility.
- **Push Notifications**: Real-time alerts for election starts and result announcements via Web Sockets or Firebase.
- **SMS Integration**: Offering mobile-based OTP verification for users without reliable email access.
