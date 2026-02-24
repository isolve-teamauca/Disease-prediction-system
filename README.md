# MedPredict — Disease Risk Prediction System

A full-stack web application for **clinically-informed disease risk assessment**. Patients and health providers can run risk predictions for heart disease, diabetes, hypertension, and stroke; admins get system-wide statistics and user management.

**Repository:** [github.com/isolve-teamauca/Disease-prediction-system](https://github.com/isolve-teamauca/Disease-prediction-system)

---

## Features

- **Three roles:** Patient, Health Provider, Admin  
- **Risk assessments:** Heart disease, diabetes, hypertension, stroke (ML-based probability and risk level)  
- **Patient dashboard:** Run predictions, view history, track risk over time, share patient code with providers  
- **Health provider dashboard:** Look up patients by ID, view their predictions, export CSV  
- **Admin dashboard:** System stats, predictions by disease/risk level, daily trend, **all registered users** (patients and providers), recent registrations  
- **PDF reports:** Download risk reports with patient ID and recommendations  
- **Responsive UI:** React + Tailwind; white/red theme; login and register with show/hide password  

---

## Tech stack

| Layer    | Stack |
| -------- | ----- |
| **Backend** | Django 5, Django REST Framework, Session auth, PostgreSQL (production) / SQLite (local) |
| **ML**      | scikit-learn, joblib, pandas (pre-trained pipelines per disease) |
| **Frontend**| React 18, Vite, React Router, Tailwind CSS, Recharts, Axios, jsPDF |
| **Deploy**  | Backend: Render (Gunicorn, dj-database-url, WhiteNoise, CORS). Frontend: Vercel |

---

## Project structure

```
Disease-prediction-system/
├── backend/                 # Django API
│   ├── config/              # Settings, URLs
│   ├── apps/
│   │   ├── accounts/        # Auth, user model, admin stats & users API
│   │   ├── patients/        # Patient profiles, lookup
│   │   └── predictions/    # Predictions, ML inference
│   ├── requirements.txt
│   ├── build.sh             # Render build (collectstatic, migrate)
│   └── manage.py
├── frontend/                # React SPA
│   ├── src/
│   │   ├── api/             # Axios instance (VITE_API_URL)
│   │   ├── components/
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Login, Register, Dashboards, Predict, History, HowItWorks, Admin
│   │   └── main.jsx, App.jsx
│   ├── public/
│   │   └── _redirects       # SPA fallback
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Python 3.10+** (backend)  
- **Node.js 18+** and npm (frontend)  
- Optional: **PostgreSQL** (for production; local runs on SQLite)

---

## Quick start

### 1. Backend (Django API)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate      # macOS/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API runs at **http://localhost:8000**. Root: `http://localhost:8000/` for endpoints list.

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:3000**. Set `VITE_API_URL=http://localhost:8000` in `.env` if the API is not on that URL.

### 3. Admin dashboard credentials

Admin accounts are **not** created from the registration page. On **deploy**, `build.sh` creates a default admin if none exists.

| Field    | Value |
| -------- | ----- |
| **Email** | `admin@medpredict.com` |
| **Password** | `Admin@2026` |

On the **Login** page, choose **Admin** in the role selector, then sign in with the email and password above.

To create an admin manually (e.g. locally), from the **backend** directory:

```bash
python manage.py shell -c "from apps.accounts.models import User; u = User.objects.create_superuser('admin', 'admin@medpredict.com', 'Admin@2026'); u.role = 'admin'; u.save()"
```

---

## Environment variables

### Backend (e.g. Render)

| Variable           | Description |
| ------------------ | ----------- |
| `SECRET_KEY`       | Django secret (required in production) |
| `DEBUG`            | Set to `False` in production |
| `ALLOWED_HOSTS`    | Comma-separated hosts (e.g. `your-app.onrender.com`) |
| `DATABASE_URL`     | PostgreSQL URL (Render provides this) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (e.g. `https://your-app.vercel.app`) |

### Frontend (e.g. Vercel)

| Variable       | Description |
| -------------- | ----------- |
| `VITE_API_URL` | Backend API base URL (e.g. `https://your-api.onrender.com`) |

---

## Deployment

- **Backend (Render):** Use `build.sh` as build command (`pip install -r requirements.txt`, `collectstatic`, `migrate`). Start command: `gunicorn config.wsgi:application`. Set root directory to `backend` and add the env vars above.
- **Frontend (Vercel):** Root directory `frontend`; set `VITE_API_URL` to your backend URL. Build/output use default Vite `dist`.

---

## API overview

| Endpoint | Method | Auth | Description |
| -------- | ------ | ---- | ----------- |
| `/api/auth/login/` | POST | No | Session login (email + password) |
| `/api/auth/register/` | POST | No | Register patient or provider |
| `/api/auth/logout/` | POST | Yes | Session logout |
| `/api/auth/me/` | GET | Yes | Current user |
| `/api/patients/` | GET | Yes | Patient lookup (provider: by `patient_id`) |
| `/api/predict/<disease>/` | POST | Yes | Run prediction |
| `/api/predictions/` | GET | Yes | List predictions (optional `patient_id` for providers) |
| `/api/admin/stats/` | GET | Admin | Dashboard stats |
| `/api/admin/users/` | GET | Admin | All registered users |

---

## License

This project is part of the [isolve-teamauca](https://github.com/isolve-teamauca) organization. See repository for license details.
