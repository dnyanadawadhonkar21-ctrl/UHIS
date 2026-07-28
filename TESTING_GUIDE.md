# UHIS API & E2E Testing Guide

## 1. Automated API Endpoint Tests (cURL)

### Authentication
```bash
# 1. Login as Doctor
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.sharma@apollo.org", "password":"password123"}'
```

### Unified Medical Timeline
```bash
# Fetch Unified Timeline for Patient
curl -X GET http://localhost:5000/api/v1/patients/timeline \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### AI Symptom Checker Engine
```bash
curl -X POST http://localhost:5000/api/v1/ai/symptom-checker \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{"symptoms": ["chest pain", "shortness of breath"]}'
```

---

## 2. End-to-End Functional Test Checklist

- [x] **Super Admin**: View system stats, onboard hospital, inspect compliance audit logs.
- [x] **Hospital Admin**: View doctor roster, department metrics, hospital revenue.
- [x] **Doctor**: View today's OPD queue, view patient history timeline, issue digital e-prescription.
- [x] **Patient**: View digital ABHA Health Card, view unified medical record timeline, book doctor appointment.
- [x] **Laboratory**: View test order queue, upload diagnostic report findings.
- [x] **Pharmacy**: View e-prescription queue, manage medicine inventory stock, dispense & invoice.
- [x] **Receptionist**: Register walk-in patient, issue digital ABHA token, track doctor queue.
- [x] **AI Suite**: Test symptom triage, health risk calculator, NLP document classifier, prescription OCR scanner.
