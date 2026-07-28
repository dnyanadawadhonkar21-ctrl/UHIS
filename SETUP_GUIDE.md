# UHIS Local Setup Guide

Follow these steps to run both the **Backend Express API** and **Frontend React App** on your local machine.

---

## 📋 Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

---

## 1️⃣ Backend Setup

1. Open terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize Database Schema & Run Migrations:
   ```bash
   npx prisma db push
   ```
4. Seed Database with Demo Accounts & Medical Records:
   ```bash
   npm run seed
   ```
5. Start Backend Server:
   ```bash
   npm run dev
   ```
   *The backend will start at `http://localhost:5000`.*
   *Health Check: `http://localhost:5000/api/v1/health`*

---

## 2️⃣ Frontend Setup

1. Open a second terminal window and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Frontend Development Server:
   ```bash
   npm run dev
   ```
   *Open your browser at `http://localhost:5173`.*

---

## 🧪 Quick Test

1. Navigate to `http://localhost:5173`
2. Click **"Switch Role Demo"** on the Navbar or Login page.
3. Select any role card (e.g. Doctor, Patient, Lab, Pharmacy) to switch sessions instantly and test all dashboards!
