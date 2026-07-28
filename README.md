# Unified Healthcare Interface System (UHIS)
> **Startup-Grade, Production-Level Modular Healthcare Management Platform**  
> *Final Year B.Tech Project in Artificial Intelligence & Data Science*

UHIS (Unified Healthcare Interface System) addresses the global challenge of fragmented medical records. Today, patients visit multiple hospitals, clinics, diagnostic centers, and pharmacies, with each organization storing data in silos. UHIS provides a centralized, secure platform where every patient possesses a unique digital identity (**ABHA Identity Ready**) that aggregates consultations, prescriptions, diagnostic lab reports, surgeries, and vaccinations into a single interactive medical timeline.

---

## 🚀 Key System Features

- **7 Dedicated Role Portals**:
  1. **Super Admin**: System metrics, hospital onboarding, role management & immutable security audit logs.
  2. **Hospital Admin**: Hospital statistics, doctor roster, department allocation & revenue analytics.
  3. **Doctor**: OPD appointment queue, patient medical history lookup, digital e-prescription builder, diagnosis logger.
  4. **Patient**: Digital ABHA Health Card, unified medical history timeline, doctor OPD booking, emergency contact manager.
  5. **Laboratory**: NABL lab test queue, parameter result recorder, diagnostic report PDF file upload.
  6. **Pharmacy**: E-Prescription fulfillment queue, inventory stock manager, dispense invoicing.
  7. **Receptionist**: OPD walk-in registration, digital token issuance, doctor queue tracker.
- **Centralized Unified Medical History**: Chronological, searchable timeline aggregating consultations, lab results, prescriptions, surgeries, and vaccinations.
- **Digital ABHA Card**: Digital Ayushman Bharat Health Account identity card generation with QR code simulation, emergency numbers, and print support.
- **AI & Data Science Suite**:
  - **Symptom Triage Engine**: Predictive ML symptom checker providing clinical risk scores and triage guidance.
  - **Health Risk Calculator**: Multi-factor lifestyle & vitals health index calculator (Cardiovascular, Diabetes, Hypertension).
  - **Medical Report NLP Classifier**: Auto-categorization of pathology, radiology, and biochemistry reports with entity extraction.
  - **Prescription OCR Scanner**: Handwritten & printed prescription text parser.

---

## 🛠️ Architecture & Tech Stack

```
           [ React + Vite + Tailwind CSS Frontend ]
                             │
                     ( REST API / JWT )
                             ▼
             [ Node.js + Express.js Backend (MVC) ]
                             │
                       ( Prisma ORM )
                             ▼
           [ MySQL / SQLite Relational Database ]
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion, Axios, React Router DOM v6.
- **Backend**: Node.js, Express.js (MVC Pattern), Prisma ORM, JWT, Bcrypt, Helmet, CORS, Express-Rate-Limit.
- **Database**: SQLite (Zero-config local dev) / MySQL / PostgreSQL (Production deployment).

---

## 🔑 Demo Single-Click Logins

All demo accounts pre-seeded with password: `password123`

| Role | Demo Email | Primary Dashboard |
| :--- | :--- | :--- |
| **Super Admin** | `admin@uhis.org` | `/admin-dashboard` |
| **Hospital Admin** | `hospitaladmin@apollo.org` | `/hospital-dashboard` |
| **Doctor** | `dr.sharma@apollo.org` | `/doctor-dashboard` |
| **Patient** | `patient.rahul@gmail.com` | `/patient-dashboard` |
| **Laboratory** | `lab.metro@uhis.org` | `/lab-dashboard` |
| **Pharmacy** | `pharmacy.city@uhis.org` | `/pharmacy-dashboard` |
| **Receptionist** | `receptionist.pria@apollo.org` | `/reception-dashboard` |

---

## 📂 Project Structure

```
UHIS/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 17+ Normalized Database Models
│   │   └── seed.js             # Seed script for all 7 user roles
│   ├── src/
│   │   ├── config/             # Prisma & JWT config
│   │   ├── controllers/        # Express controllers (Auth, Patient, Doctor, AI, etc.)
│   │   ├── middleware/         # Auth, RBAC, RateLimiter, ErrorHandler
│   │   ├── routes/             # REST API routes (/api/v1/...)
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, ABHACardModal, Timeline, RoleSwitcher
│   │   ├── context/            # AuthContext & role state
│   │   ├── pages/              # 7 Role Dashboards, Login, Register, AI Suite
│   │   ├── services/           # Axios API instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── README.md
├── SETUP_GUIDE.md
├── DEPLOYMENT_GUIDE.md
└── TESTING_GUIDE.md
```
