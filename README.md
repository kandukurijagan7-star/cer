# CertiFlow — Enterprise Digital Certificate Platform

> **Official Certificate Issuance, Distribution & Verification Platform for SIMATS Engineering**  
> Built for **SYNORA '26 National Technical Symposium** & Enterprise Multi-Event Management.

---

## 🌟 Key Features

* **Multi-Tenant & Multi-Event Architecture**: Manage organizations, symposiums, hackathons, and workshops with custom branding and dates.
* **Visual Drag-and-Drop Template Builder**: Live HTML5 Canvas coordinate designer with dynamic tags (`{{recipient_name}}`, `{{team_name}}`, `{{certificate_id}}`, etc.), layer management, and version history.
* **Deterministic Server & Client PDF Engine**: Generates standard vector A4 landscape certificates with embedded high-contrast QR codes and SHA-256 document integrity checksums.
* **Public Cryptographic Verification Portal (`/verify/:id`)**: Mobile-first verification endpoint with QR code scanner, revocation detection, audit scan logging, and 1-click LinkedIn/WhatsApp sharing.
* **Smart Bulk Import & Legacy Sheets Adapter**: Import CSV, Excel, or synchronize directly from existing Google Apps Script / Google Sheets endpoints without data loss.
* **Queue-Based Email Campaign Engine**: Asynchronous batch email dispatching with PDF attachments, delivery status tracking (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`), and retry support.
* **Attendee Certificate Wallet PWA**: Installable digital credential wallet for students and participants.
* **Role-Based Access Control (RBAC)**: Server-side enforced permissions for 8 granular roles (`SUPER_ADMIN` to `PARTICIPANT`).
* **Executive BI Analytics Dashboard**: Real-time KPI metrics, delivery success rates, institutional distribution rankings, and exportable audit logs.

---

## 🚀 Quickstart Guide

### 1. Installation & Setup
```bash
# Clone repository and enter directory
cd "certificate sharing website"

# Install dependencies
npm install

# Push database schema & generate Prisma Client
npx prisma db push

# Seed demo dataset (SIMATS Engineering, SYNORA '26, certificates)
node scripts/seed.js
```

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Launch Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🔐 Pre-Configured Administrator Login
- **Email**: `admin@certiflow.io`
- **Password**: `synora2026`
- **Role**: `SUPER_ADMIN`

---

## 📁 Project Architecture & Documentation

- [System Architecture Specification](docs/ARCHITECTURE.md)
- [REST API v1 Reference](docs/API.md)
- [Database Schema & ERD](docs/DATABASE.md)
- [Security & RBAC Model](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Legacy Google Sheets Migration](docs/MIGRATION.md)

---

## 🏛️ Issuer Information
**Department of Nanobiomaterials**  
SIMATS Engineering, Saveetha Institute of Medical and Technical Sciences (SIMATS), Chennai, Tamil Nadu, India.
