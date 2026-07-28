# UHIS Production Deployment Guide

This guide details how to deploy UHIS across **Vercel** (Frontend), **Render** (Backend), and **Railway / Aiven** (MySQL Database).

---

## 1. Database Deployment (Railway or Aiven MySQL)

1. Create a MySQL database instance on Railway / Aiven.
2. Note your database connection string:
   `mysql://username:password@host.railway.app:3306/uhis_db`
3. Update `backend/prisma/schema.prisma` datasource for MySQL:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

---

## 2. Backend Deployment (Render.com)

1. Push your repository to GitHub.
2. Log in to [Render.com](https://render.com) and create a **Web Service**.
3. Select your repository and configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma db push && node prisma/seed.js`
   - **Start Command**: `node src/server.js`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = `mysql://username:password@host:3306/uhis_db`
   - `JWT_SECRET` = `your_secure_jwt_secret_key`
   - `CORS_ORIGIN` = `https://your-uhis-app.vercel.app`

---

## 3. Frontend Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com) and import your GitHub repository.
2. Set Root Directory to `frontend`.
3. Framework Preset: **Vite**.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-uhis-backend.onrender.com/api/v1`
5. Click **Deploy**.
