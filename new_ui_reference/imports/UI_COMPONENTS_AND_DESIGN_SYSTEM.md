# Unified Health Interface System (UHIS) — UI Design System & Component Specification

> **Version:** 2.0.0  
> **Target Audience:** Frontend Engineers, UI/UX Designers, Medical Informatics Architects, Product Managers  
> **Status:** Production Reference  

---

## 1. Executive Design Philosophy & System Overview

The **Unified Health Interface System (UHIS)** is a mission-critical, enterprise-grade healthcare management and electronic medical records (EMR/EHR) platform. Unlike consumer marketing websites or generic SaaS dashboards, the interface is designed around strict clinical informatics principles:

- **Clinical Clarity & High Contrast:** Uncluttered layouts that prioritize vital physiological data, diagnostic timelines, and alert states over decorative design trends.
- **De-Cluttered Information Architecture:** Deep information density presented through collapsible accordions, tabbed workspaces, and progressive disclosure to prevent physician and patient cognitive fatigue.
- **Accessible & Multimodal:** WCAG 2.1 AA compliant typography (minimum 14px supporting text, 28–32px primary headers), robust keyboard shortcuts (`Ctrl /`, `Ctrl K`), and visible focus rings.
- **Dual-Theme Optimization:** True medical dark mode using deep navy and slate tones (`bg-slate-950` / `bg-slate-900`) alongside an ultra-clean clinical light mode (`bg-slate-50` / `bg-white`).
- **Standardized Identity & Security:** Integrated with India's Ayushman Bharat Digital Mission (ABDM) ABHA ID standard, featuring visual digital health cards, OTP flows, and role-based access control.

---

## 2. Color Palette & Theme Matrix (Light vs. Dark Mode)

UHIS utilizes a clinical color system centered around **Deep Teal** and **Clinical Cyan** as primary accents, supported by semantic status colors calibrated for medical safety.

### 2.1 Core Palette Tokens

| Semantic Token | Light Mode Class & Hex | Dark Mode Class & Hex | Clinical Context & Purpose |
| :--- | :--- | :--- | :--- |
| **Page Background** | `bg-slate-50` (`#f8fafc`) | `bg-slate-950` (`#020617`) | Global application background canvas. |
| **Card / Surface** | `bg-white` (`#ffffff`) | `bg-slate-900` (`#0f172a`) | Primary card, modal, and drawer surface. |
| **Sub-Surface / Row** | `bg-slate-50/60` (`#f8fafc`) | `bg-slate-800/40` (`#1e293b`) | Table rows, accordion item bodies, secondary containers. |
| **Border / Divider** | `border-slate-200/80` (`#e2e8f0`) | `border-slate-800` (`#1e293b`) | Subtle dividing borders with high structural clarity. |
| **Primary Accent (Teal)** | `text-teal-600` / `bg-teal-600` (`#0d9488`) | `text-teal-400` / `bg-teal-500` (`#2dd4bf` / `#14b8a6`) | Primary interactive buttons, active nav links, UHIS brand marks. |
| **Primary Accent Tint** | `bg-teal-50` / `border-teal-200` (`#f0fdfa`) | `bg-teal-500/10` / `border-teal-500/30` | Selected navigation items, badge backgrounds. |
| **Critical / Emergency (Rose)**| `text-rose-600` / `bg-rose-50` (`#e11d48`) | `text-rose-400` / `bg-rose-500/10` (`#fb7185`) | Severe allergies, active chronic diseases, emergency contacts, cancellations. |
| **Warning / Alert (Amber)** | `text-amber-700` / `bg-amber-50` (`#b45309`) | `text-amber-300` / `bg-amber-500/15` (`#fcd34d`) | Due vaccines, pending lab results, moderate severity warnings. |
| **Success / Verified (Emerald)**| `text-emerald-700` / `bg-emerald-50` (`#047857`)| `text-emerald-400` / `bg-emerald-500/15` (`#34d399`)| Completed visits, verified ABHA IDs, active normal parameters. |
| **Information / RX (Blue)** | `text-blue-700` / `bg-blue-50` (`#1d4ed8`) | `text-blue-300` / `bg-blue-500/15` (`#93c5fd`) | Active medications, dosage instructions, OPD consultation slots. |
| **Immunization (Purple)** | `text-purple-700` / `bg-purple-50` (`#6b21a8`) | `text-purple-400` / `bg-purple-500/15` (`#c084fc`)| Vaccination history, immunization batch records. |

### 2.2 Text Contrast & Readability Scale

```
[Light Theme Text Hierarchy]
Primary Body / Headings:   #0f172a (slate-900)  — 14.8:1 Contrast Ratio (AAA)
Secondary / Supporting:     #475569 (slate-600)  — 7.2:1 Contrast Ratio (AAA)
Subtext / Timestamps:       #64748b (slate-500)  — 4.9:1 Contrast Ratio (AA)

[Dark Theme Text Hierarchy]
Primary Body / Headings:   #ffffff (white) / #f1f5f9 (slate-100) — 18.5:1 Contrast Ratio (AAA)
Secondary / Supporting:     #cbd5e1 (slate-300)  — 11.2:1 Contrast Ratio (AAA)
Subtext / Timestamps:       #94a3b8 (slate-400)  — 6.8:1 Contrast Ratio (AA)
```

---

## 3. Typography Hierarchy & Sizing Guidelines

All typography is rendered using modern system sans-serif font families (`Inter`, `system-ui`, `-apple-system`, `sans-serif`) with enhanced font-sizes specifically optimized for readability across clinical tablets, laptops, and workstations.

```
┌─────────────────────────┬──────────────────────┬─────────────┬────────────┬────────────────────────┐
│ Hierarchy Level         │ Tailwind Class       │ Desktop     │ Mobile     │ Typical Usage          │
├─────────────────────────┼──────────────────────┼─────────────┼────────────┼────────────────────────┤
│ Page Main Heading (H1)  │ .text-heading-xl     │ 32px (2rem) │ 28px       │ Dashboard Welcome, Page│
│                         │ font-black           │             │            │ Main View Headers      │
│ Section Heading (H2)    │ .text-heading-lg     │ 24px        │ 20px       │ Section Headers, Form  │
│                         │ font-bold            │             │            │ Category Dividers      │
│ Module / Card Title(H3) │ .text-heading-md     │ 20px        │ 18px       │ Accordion Bar Titles,  │
│                         │ font-bold            │             │            │ Modal Main Headers     │
│ Component Sub-Card (H4) │ .text-card-title     │ 18px        │ 16px       │ Sub-item Headers, Test │
│                         │ font-bold            │             │            │ Record Names           │
│ Standard Body Text (P)  │ .text-body           │ 16px (1rem) │ 15px       │ Clinical Descriptions, │
│                         │ font-normal/medium   │             │            │ Diagnostic Notes       │
│ Small / Metadata Label  │ .text-subtext        │ 14px        │ 14px (min) │ Timestamp, Doctor Name,│
│                         │ font-semibold        │             │            │ Field Captions         │
│ Medical Identifier/Code │ font-mono            │ 13px - 15px │ 13px       │ ABHA ID, ICD-10 Code,  │
│                         │ font-bold            │             │            │ Batch Numbers          │
└─────────────────────────┴──────────────────────┴─────────────┴────────────┴────────────────────────┘
```

---

## 4. UI Architecture & Responsive Wireframe

The application shell implements a 3-tier layout: Fixed Header + Collapsible Left Sidebar + Flexible Content Area (with right-side utility rail on desktop).

```
+----------------------------------------------------------------------------------------------------+
|  UHIS FIXED TOP HEADER [Navbar.jsx]                                                                |
|  [Logo + Menu Toggle]      [Global Medical Search: "Ctrl /"]      [Theme] [Alerts (3)] [User Menu] |
+------------------+-------------------------------------------------------------+-------------------+
|  LEFT SIDEBAR    |  MAIN CONTENT WORKSPACE                                     |  RIGHT RAIL       |
|  [Sidebar.jsx]   |                                                             |  (Desktop)        |
|                  |  Greeting: "Good evening, Rahul! 👋"                        |                   |
|  - Overview      |  +-------------------------------------------------------+  |  [Quick Actions]  |
|  - Timeline      |  | PATIENT PROFILE CARD (ABHA ID, Age, Blood Group, etc.)|  |  - Book Appt      |
|  - Conditions    |  +-------------------------------------------------------+  |  - Upload Report  |
|  - Medications   |                                                             |  - Add Med        |
|  - Labs          |  [ 5 COMPACT SUMMARY CARDS (Conditions, RX, Allergies...) ] |  - Symptom Check  |
|  - Appointments  |                                                             |                   |
|  - Vaccinations  |  [ 8 COLLAPSIBLE ACCORDIONS (Collapsed by Default) ]        |  [Health Alerts]  |
|                  |  1. [>] Personal & Contact Information                      |  - Severe Allergy |
|  [Tools]         |  2. [>] Medical Conditions (Diseases)                       |  - Hydration      |
|  - AI Suite      |  3. [>] Allergy Records                                     |                   |
|  - OCR Scanner   |  4. [>] Vaccination History                                 |  [Wellness Stats] |
|                  |  5. [>] Current Medications                                 |  - 6,420 Steps    |
|  [Support Box]   |  6. [>] Laboratory Reports                                  |  - 7h 15m Sleep   |
|  © 2026 UHIS     |  7. [>] Medical Visits & Appointments                       |  - 2.1L Water     |
|                  |  8. [>] Health Timeline (Longitudinal View)                 |                   |
+------------------+-------------------------------------------------------------+-------------------+
```

---

## 5. Comprehensive Page-by-Page Specification

### 5.1 Public & Authentication Pages

#### 1. `LandingPage.jsx` — Public National Portal Gateway
- **Route:** `/`
- **Purpose:** Public landing page introducing UHIS national architecture, ABDM compliance, multi-facility interoperability, and AI diagnostic capabilities.
- **Color Accents:** Teal-600 primary gradients, Cyan-500 highlights, Slate-900 dark background accents.
- **Key Sections:**
  - *Hero Header:* Brand logo, navigation links (Features, Architecture, Portals), Light/Dark toggle, "Login" / "Register" CTA buttons.
  - *Hero Section:* High-impact value proposition ("One Nation, One Unified Health Record"), interactive metric counters (10M+ Records, 99.9% Uptime, 500+ Connected Hospitals).
  - *Feature Pillars:* 4 core cards covering Longitudinal Records, AI Clinical Intelligence, ABHA Universal ID, and End-to-End Encryption.
  - *Role Portals Grid:* 6 quick-access cards for Patients, Doctors, Hospital Admins, Labs, Pharmacies, and Receptionists.
  - *Footer:* National health grid compliance notices, quick links, emergency helpline numbers.

#### 2. `Login.jsx` — Multi-Role Secure Authentication
- **Route:** `/login`
- **Purpose:** Secure authentication gateway supporting Email/Password, ABHA ID login, Role Selection, and Demo 1-Click Login buttons for immediate role testing.
- **Structure:**
  - Centered glassmorphic card on subtle teal ambient gradient.
  - Role selector pill bar (Patient, Doctor, Admin, Lab, Pharmacy, Receptionist).
  - Credentials form with `PasswordInput` (password visibility toggle).
  - "1-Click Demo Login" quick button bar for rapid evaluation.
  - Toast feedback trigger on success/error.

#### 3. `Register.jsx` — Multi-Step Clinical Onboarding
- **Route:** `/register`
- **Purpose:** Comprehensive multi-role onboarding with role-specific medical registration steps.
- **Structure:**
  - *Step 1: Account & Role Selection:* Basic credentials, full name, phone number, role picker.
  - *Step 2: Role-Specific Medical Profile:*
    - *Patient:* DOB, Gender, Blood Group, Height, Weight, Emergency Contact, Address, Medical History flags.
    - *Doctor:* Medical Registration Number (MCI/NMC), Specialization, Experience Years, Consultation Fee, Hospital Affiliation.
    - *Hospital/Lab/Pharmacy:* Facility License Number, Department, Capacity.
  - *Step 3: Verification & ABHA Generation:* OTP verification simulator and ABHA Number assignment.

#### 4. `NotFound.jsx` — 404 Error State
- **Route:** `*`
- **Purpose:** Clean, accessible 404 recovery page with clear navigation back to the user's appropriate portal.

---

### 5.2 Dashboard & Clinical Portals

#### 5. `DashboardSelectionPage.jsx` — Multi-Portal Switcher
- **Route:** `/dashboard-selection`
- **Purpose:** Role hub allowing authenticated users with multi-facility privileges to select their active portal.
- **Structure:**
  - Hero greeting with active user credentials.
  - 7 interactive role cards (Patient Portal, Doctor OPD, Hospital Admin, Super Admin, Diagnostic Lab, Pharmacy Dispense, Reception OPD).

#### 6. `PatientDashboard.jsx` — Patient Longitudinal Health Portal
- **Route:** `/patient-dashboard`
- **Purpose:** Central health portal for patients to view all medical history, manage appointments, and track wellness.
- **Structure:**
  - *Greeting Header:* Dynamic time-aware greeting + patient first name.
  - *Profile Card:* Avatar, ABHA ID badge, DOB, Calculated Age, Blood Group, Contact, Edit Profile modal trigger.
  - *5 Summary Cards:* Active Conditions, Medications, Allergies, Upcoming Appts, Pending Reports (clicking scrolls to section).
  - *8 Collapsible Accordions (Collapsed by default):*
    1. Personal & Contact Information (`PatientProfileInfo.jsx`)
    2. Medical Conditions (`DiseaseHistory.jsx`)
    3. Allergy Records (`AllergyRecords.jsx`)
    4. Vaccination History (`VaccinationHistory.jsx`)
    5. Current Medications (`CurrentMedications.jsx`)
    6. Laboratory Reports (`LabReports.jsx`)
    7. Medical Visits & Appointments (`MedicalVisitsAppointments.jsx`)
    8. Health Timeline (`UnifiedMedicalTimeline.jsx`)
  - *Right Rail (Desktop):* Quick Action shortcuts, Health Alerts panel, Wellness Stats (Steps, Sleep, Water, Activity).
  - *Support:* `FAQAccordion.jsx`, `BackToTop.jsx`, `DigitalABHACardModal.jsx`.

#### 7. `DoctorDashboard.jsx` — Clinical OPD & EHR Console
- **Route:** `/doctor-dashboard`
- **Purpose:** Physician clinical workstation for managing today's OPD queue, reviewing patient history, writing diagnoses, and building digital prescriptions.
- **Structure:**
  - *OPD Summary Bar:* Today's Total Patients, Waiting, In-Consultation, Completed.
  - *Active Patient Queue Table:* Token number, Patient Name, Age/Gender, Chief Complaint, Status badge, "Start Consultation" CTA.
  - *Active Consultation Workspace:* Live patient vitals drawer, past medical history glance, clinical notes editor, and `PrescriptionBuilderModal` trigger.

#### 8. `HospitalAdminDashboard.jsx` — Facility Operations Center
- **Route:** `/hospital-dashboard`
- **Purpose:** Hospital resource management, bed availability tracking, doctor on-duty rosters, and OPD footfall metrics.
- **Structure:**
  - Real-time stat cards (ICU Occupancy, General Beds, Active Doctors, Today's Admissions).
  - Departmental occupancy progress bars (Cardiology, Orthopedics, Pediatrics, Emergency).
  - Staff duty roster table with status indicators.

#### 9. `SuperAdminDashboard.jsx` — National Health Grid Governance
- **Route:** `/admin-dashboard`
- **Purpose:** System-wide governance, hospital network onboarding, security audits, and API gateway health monitoring.
- **Structure:**
  - Global network KPIs (Connected Hospitals, Total Registered ABHA IDs, Daily API Transactions).
  - Hospital verification request queue with Approve/Reject actions.
  - System error log monitor and server uptime graphs.

#### 10. `LabDashboard.jsx` — Diagnostic Pathology Console
- **Route:** `/lab-dashboard`
- **Purpose:** Pathology laboratory workflow for receiving sample orders, updating specimen collection status, and uploading diagnostic test PDFs/results.
- **Structure:**
  - Filterable test order queue (Pending Collection, In-Processing, Completed).
  - Test result entry modal with standard reference range validators.
  - PDF report attachment and notification dispatch trigger.

#### 11. `PharmacyDashboard.jsx` — Prescription Dispensation & Inventory
- **Route:** `/pharmacy-dashboard`
- **Purpose:** Pharmacist workstation for verifying digital prescriptions by ABHA ID/Token, dispensing medications, and tracking stock levels.
- **Structure:**
  - Prescription verification lookup bar (Search by Rx Number or Patient Mobile).
  - Dispense checklist showing dosage, substitution warnings, and stock deduction.
  - Low-stock medication alerts panel.

#### 12. `ReceptionistDashboard.jsx` — Hospital Front Desk & OPD Token Desk
- **Route:** `/reception-dashboard`
- **Purpose:** Front desk check-in, walk-in patient registration, doctor slot assignment, and printable OPD token generation.
- **Structure:**
  - Quick patient lookup / ABHA QR code scan input.
  - Doctor live availability matrix.
  - Instant OPD Token slip generator.

#### 13. `AISuiteView.jsx` — Clinical Intelligence & Diagnostic AI Tools
- **Route:** `/ai-suite`
- **Purpose:** 4-in-1 medical AI workspace for clinical decision support and patient comprehension.
- **Tools Included:**
  1. *AI Symptom Checker:* Conversational assessment identifying probable triage categories.
  2. *Lab Report Explainer:* Plain-language translation of complex pathology markers.
  3. *Drug-Drug Interaction Analyzer:* Contraindication checker for polypharmacy safety.
  4. *Medical OCR Scanner:* Digitizes physical prescription slips and lab prints into structured JSON.

#### 14. `MedicalRecordsView.jsx` — Centralized Longitudinal Timeline
- **Route:** `/medical-timeline`
- **Purpose:** Full-screen longitudinal health record showing a unified multi-facility timeline across past hospitalizations, surgeries, lab tests, and prescriptions.

---

## 6. Component-by-Component Deep Dive

### 6.1 Layout & Shell Components

#### 1. `Navbar.jsx`
- **File:** `frontend/src/components/Navbar.jsx`
- **Props:** `onOpenRoleSwitcher: func`, `isSidebarCollapsed: bool`, `onToggleSidebar: func`
- **Visual Design:** Fixed sticky header (`h-16`), backdrop blur (`backdrop-blur-md`), 1px bottom border.
- **Key Elements:**
  - Sidebar hamburger toggle with accessible tooltip.
  - UHIS brand logo with active "Portal" badge.
  - Global search bar with `Ctrl /` shortcut badge and keydown focus listener.
  - Quick role switcher button.
  - Light/Dark theme toggle (Sun/Moon icon with transition).
  - Notification bell with unread count badge + dropdown popover.
  - Patient avatar with initials, full name, role badge, and sign-out dropdown.

#### 2. `Sidebar.jsx`
- **File:** `frontend/src/components/Sidebar.jsx`
- **Props:** `isCollapsed: bool`, `onToggleCollapse: func`, `onNavigateSection: func`
- **Visual Design:** Smooth width transition (`w-64` expanded $\to$ `w-20` collapsed), right border.
- **Key Elements:**
  - Grouped navigation links with Lucide icons (`OVERVIEW`, `MY HEALTH`, `TOOLS`).
  - Icon-only collapsed mode with native hover tooltips (`title` attribute).
  - 24/7 Medical support contact card with emergency helpline trigger.
  - Dynamic active link highlight (`bg-teal-50` / `dark:bg-teal-500/15`).

#### 3. `BackToTop.jsx`
- **File:** `frontend/src/components/BackToTop.jsx`
- **Visual Design:** Floating action button (`fixed bottom-6 right-6`), Teal background, white icon.
- **Behavior:** Automatically appears when user scrolls past 300px; smooth scroll to window top on click.

#### 4. `QuickRoleSwitcherModal.jsx`
- **File:** `frontend/src/components/QuickRoleSwitcherModal.jsx`
- **Props:** `isOpen: bool`, `onClose: func`
- **Visual Design:** Centered backdrop modal featuring 7 role cards with icon accents and 1-click role elevation.

---

### 6.2 UI Feedback & Utility Components

#### 5. `SkeletonLoader.jsx`
- **File:** `frontend/src/components/SkeletonLoader.jsx`
- **Exported Sub-Components:** `SkeletonProfile`, `SkeletonList`, `SkeletonTimeline`, `SkeletonCard`, `SkeletonTable`
- **Visual Design:** Accessible pulse animation (`animate-pulse`), neutral slate fills (`bg-slate-200` / `dark:bg-slate-800`), matching exact aspect ratios of final loaded cards.

#### 6. `EmptyState.jsx`
- **File:** `frontend/src/components/EmptyState.jsx`
- **Props:** `message: string`, `subtext: string`, `actionLabel: string`, `onAction: func`
- **Visual Design:** Dashed border container (`border-dashed border-slate-200 dark:border-slate-800`), centered muted icon, clean non-alarmist copy.

#### 7. `PasswordInput.jsx`
- **File:** `frontend/src/components/PasswordInput.jsx`
- **Props:** `value: string`, `onChange: func`, `placeholder: string`, `name: string`, `id: string`
- **Visual Design:** Standard input with embedded `Eye` / `EyeOff` button on right, fully accessible via keyboard.

#### 8. `FAQAccordion.jsx`
- **File:** `frontend/src/components/FAQAccordion.jsx`
- **Visual Design:** Compact, expandable clinical FAQ accordion answering common patient questions (ABHA linking, emergency data access, report privacy).

#### 9. `StatCard.jsx`
- **File:** `frontend/src/components/StatCard.jsx`
- **Props:** `title: string`, `value: string|number`, `icon: LucideIcon`, `trend: string`, `color: string`
- **Visual Design:** Elevated metric container with top icon, large bold count, and contextual percentage badge.

---

### 6.3 Clinical Modals

#### 10. `DigitalABHACardModal.jsx`
- **File:** `frontend/src/components/DigitalABHACardModal.jsx`
- **Props:** `patient: object`, `isOpen: bool`, `onClose: func`
- **Visual Design:** High-fidelity simulation of the official ABDM Digital ABHA Card featuring:
  - Official tricolor header banner & emblem.
  - Dynamic QR code embedding ABHA verification URI.
  - Full Name, ABHA Number (`91-XXXX-XXXX-XXXX`), ABHA Address (`@abdm`), Gender, DOB.
  - "Download Digital Card" and "Print Card" action buttons.

#### 11. `PrescriptionBuilderModal.jsx`
- **File:** `frontend/src/components/PrescriptionBuilderModal.jsx`
- **Props:** `patient: object`, `isOpen: bool`, `onClose: func`, `onPrescriptionSaved: func`
- **Visual Design:** Multi-drug prescription form with medication autocomplete, dosage frequency pills (1-0-1, 1-1-1), duration picker, dietary instructions ("After food"), and digital signature stamp.

#### 12. `EditProfileModal.jsx`
- **File:** `frontend/src/components/patient/EditProfileModal.jsx`
- **Props:** `profile: object`, `isOpen: bool`, `onClose: func`, `onProfileUpdated: func`
- **Visual Design:** Clean multi-field form modal allowing updates to Height, Weight, Phone, Address, Emergency Contact, and Primary Care Physician with validation toasts.

---

### 6.4 Patient Medical Accordion Sections

All patient medical record components support unified accordion integration:
- `isOpen: bool` — Controls expanded state.
- `onToggle: func` — Toggles accordion state.
- `loading: bool` — Displays appropriate skeleton loader.
- Unique `id` anchor for smooth scrolling from top summary cards.

#### 13. `PatientProfileInfo.jsx`
- **Anchor ID:** `section-profile`
- **Content:** Full Name, UHIS/ABHA ID, Date of Birth, Age, Gender, Blood Group, Height, Weight, Mobile, Email, Emergency Contact, Primary Physician, Full Address.
- **Action:** Triggers `EditProfileModal`.

#### 14. `DiseaseHistory.jsx`
- **Anchor ID:** `section-conditions`
- **Content:** Diagnosed conditions, ICD-10 codes, disease status badges (Active, Chronic, Recovered), severity scale, treating doctor, facility, and clinical notes.
- **Search & Filter:** Search input + status filter pills (ALL, ACTIVE, CHRONIC, RECOVERED).

#### 15. `AllergyRecords.jsx`
- **Anchor ID:** `section-allergies`
- **Content:** Allergen name, category (Food, Drug, Environmental), severity badge, allergic symptoms list, clinical precautions.
- **Visual Alert:** Pulse warning indicator for severe/critical allergies.

#### 16. `VaccinationHistory.jsx`
- **Anchor ID:** `section-vaccinations`
- **Content:** Vaccine title, dose number, administration date, hospital/clinic, batch number, next due date banner, status badges (Completed, Due Soon, Overdue).

#### 17. `CurrentMedications.jsx`
- **Anchor ID:** `section-medications`
- **Content:** Medicine name, dosage, frequency badge, prescribing doctor, start & end date, special dietary/dosage instructions.

#### 18. `LabReports.jsx`
- **Anchor ID:** `section-labs`
- **Content:** Test name, sample date, status badge (Completed, Pending), laboratory facility, structured reference result summary, and "View/Download PDF" action trigger with toast confirmation.

#### 19. `MedicalVisitsAppointments.jsx`
- **Anchor ID:** `section-visits`
- **Content:** Doctor name, hospital facility, appointment date/time slot, visit reason, status badge (Scheduled, Completed, Cancelled).
- **Sub-Tabs:** Segmented control toggling "Upcoming OPD" vs. "Past Visits".

#### 20. `UnifiedMedicalTimeline.jsx`
- **Anchor ID:** `section-timeline`
- **Content:** Unified vertical timeline connecting admissions, surgeries, prescriptions, and lab tests chronologically with category-specific icon markers.

#### 21. `HealthAlerts.jsx`
- **Content:** Urgent medical alerts (e.g. Drug contraindication alert, hydration reminder, lab report ready notice) with dismiss actions.

---

### 6.5 Global Context Providers

| Context Provider | File Path | Responsibilities |
| :--- | :--- | :--- |
| **`AuthContext.jsx`** | `frontend/src/context/AuthContext.jsx` | Manages active JWT tokens, logged-in `user` state, role verification, `login()`, `logout()`, and `demoLogin()`. |
| **`ThemeContext.jsx`** | `frontend/src/context/ThemeContext.jsx` | Manages `'light'` vs `'dark'` theme class on `document.documentElement` with `localStorage` persistence. |
| **`ToastContext.jsx`** | `frontend/src/context/ToastContext.jsx` | Global notification engine providing `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()` with auto-dismiss. |
| **`DashboardPreferenceContext.jsx`** | `frontend/src/context/DashboardPreferenceContext.jsx` | User preferences for enabling/disabling dashboard modules and summary widgets. |

---

## 7. Accessibility (WCAG 2.1) & Interaction Standards

1. **Keyboard Traversal:**
   - Global search input is instantly focused using `Ctrl /` or `Cmd /` or `Ctrl K`.
   - Skip to main content link (`.skip-to-content`) available on initial `Tab` press.
   - All interactive modal dialogs capture focus and close on `Escape`.
2. **ARIA Attributes:**
   - All accordion triggers specify `aria-expanded="true|false"`.
   - Modals use `role="dialog"` with `aria-modal="true"`.
   - Icons utilize `aria-hidden="true"` when accompanied by text, or `aria-label` when stand-alone.
3. **Focus Rings:**
   - Visible teal focus indicators (`focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`).
4. **Motion Safety:**
   - Transitions respect user OS settings via Tailwind `transition-all duration-200` with graceful degradations.

---

*Document approved for Unified Health Interface System (UHIS) codebase.*
