# MedPredict Frontend – Plan & Backend Integration

This document plans the frontend to match the MedPredict UI mockups and integrate with the Django backend.

**All frontend code lives in the project’s `frontend/` folder.**

---

## 1. Tech stack (recommended)

- **React 18** + **Vite** – SPA, fast dev server, simple build
- **React Router** – Routes for login, register, dashboard, etc.
- **Fetch or Axios** – API calls with `credentials: 'include'` for session cookies
- **CSS** – Plain CSS, CSS Modules, or Tailwind; mockups use a clean blue/white theme

**Alternative:** Next.js if you prefer file-based routing and optional SSR.

---

## 2. Backend API summary (for frontend)

Base URL: `http://127.0.0.1:8000` (dev). All API requests must send **credentials** (cookies) for authenticated endpoints.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/` | No | API info + endpoint list |
| POST | `/api/auth/login/` | No | Login; body: `{ "username" or "email", "password" }` → returns user |
| POST | `/api/auth/logout/` | Yes | Logout session |
| GET | `/api/auth/me/` | Yes | Current user |
| POST | `/api/auth/register/` | No | Register; body: see §3 |
| GET | `/api/patients/me/` | Yes (patient) | Current user’s patient profile |
| POST | `/api/predict/<disease>/` | Yes | Run prediction; body: `{ "features": {...}, optional "patient_id" }` |
| GET | `/api/predictions/` | Yes | List predictions (patient: own; provider: `?patient_id=<id>`) |
| GET | `/api/predictions/<id>/` | Yes | One prediction |

**Diseases:** `heart`, `hypertension`, `stroke`, `diabetes`.

**CORS:** Backend allows `http://localhost:3000` and `http://127.0.0.1:3000`. Set `CORS_ALLOWED_ORIGINS` in backend `.env` if your app runs on another port.

---

## 3. Auth flows and payloads

### 3.1 Login (matches “Welcome to MedPredict” screen)

- **URL:** `POST /api/auth/login/`
- **Body:** `{ "email": "user@example.com", "password": "***" }`  
  (backend also accepts `"username"` instead of `"email"`)
- **Success:** 200 + JSON user object (id, username, email, role, full_name, …).
- **Failure:** 401 + `{ "detail": "Invalid credentials." }`
- **Frontend:** Store user in state/context; rely on session cookie for later requests. Optional: show role (Patient / Healthcare Provider) from `user.role` and use it for UI (e.g. “Sign In as Patient” vs “Sign In as Healthcare Provider” is cosmetic; backend uses `user.role` for permissions).

### 3.2 Register (matches “Create Your Account” screens)

- **URL:** `POST /api/auth/register/`
- **Body (common):**  
  `username`, `email`, `password`, `confirm_password`, `role` (`"patient"` | `"provider"`), `full_name`, `phone`
- **Patient-only:** `date_of_birth` (optional; format YYYY-MM-DD for backend).
- **Provider-only:** `specialization`, `license_number`.
- **Success:** 201 + user object.
- **Failure:** 400 + field errors.

**Example – Patient:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "confirm_password": "securepass123",
  "role": "patient",
  "full_name": "John Doe",
  "phone": "+15550000000",
  "date_of_birth": "1990-01-15"
}
```

**Example – Provider:**

```json
{
  "username": "drjane",
  "email": "jane@clinic.com",
  "password": "securepass123",
  "confirm_password": "securepass123",
  "role": "provider",
  "full_name": "Jane Smith",
  "phone": "+15550000001",
  "specialization": "Cardiology",
  "license_number": "MD123456"
}
```

**Frontend:**  
- Step 1: “I am a…” → choose Patient or Healthcare Provider.  
- Step 2: Show form; for **Patient** show Full Name, Phone, Email, Date of Birth, Password, Confirm Password; for **Provider** show Full Name, Phone, Email, Specialization, License Number, Password, Confirm Password.  
- Generate `username` from email (e.g. part before `@`) or require username field if you prefer.  
- Send one `POST /api/auth/register/` with the chosen `role` and the right fields.

### 3.3 Logout

- **URL:** `POST /api/auth/logout/`
- **Auth:** Required (session cookie).
- **Success:** 204. Frontend clears user state and redirects to login.

### 3.4 Current user / session check

- **URL:** `GET /api/auth/me/`
- **Auth:** Required.
- **Success:** 200 + user object. Use on app load to restore login state (e.g. redirect to dashboard if 200, to login if 401).

---

## 4. Pages and routes (aligned with mockups)

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing or redirect to `/login` or `/dashboard` | - |
| `/login` | “Welcome to MedPredict” – role toggle, email, password, Sign in, Sign up link | No |
| `/register` | “Create Your Account” – step 1: “I am a…” (Patient / Healthcare Provider) | No |
| `/register/patient` or same page with role=patient | Form: Full Name, Phone, Email, DOB, Password, Confirm, Create Account | No |
| `/register/provider` or same page with role=provider | Form: Full Name, Phone, Email, Specialization, License, Password, Confirm, Create Account | No |
| `/dashboard` | Post-login home (patient: my predictions / run prediction; provider: select patient, view predictions) | Yes |
| `/predict` (e.g. `/predict/heart`) | Form to enter features and run prediction (and list recent predictions) | Yes |
| `/predictions` | List of predictions (patient: own; provider: with `patient_id`) | Yes |

You can merge “Create Your Account” into one route and toggle form fields by selected role instead of separate `/register/patient` and `/register/provider`.

---

## 5. UI components (from mockups)

- **Layout**
  - Centered card on light blue-grey background.
  - MedPredict logo (blue circle + ECG/heartbeat icon) and title/tagline.
- **Login**
  - Role toggle: Patient | Healthcare Provider (cosmetic; backend uses `user.role` after login).
  - Email input, Password input.
  - “Sign In as Patient” / “Sign In as Healthcare Provider” button.
  - “Demo: Use any email/password” (optional hint).
  - “Don’t have an account? Sign up” → `/register`.
- **Register – role selection**
  - “I am a…” with two cards: **Patient** (“Track my health”), **Healthcare Provider** (“Manage patients”).
  - “Already have an account? Sign in” → `/login`.
- **Register – form**
  - Full Name*, Phone, Email*, (Patient: Date of Birth | Provider: Specialization*, License Number*), Password*, Confirm Password*.
  - “Create Account” button.
  - “Already have an account? Sign in” → `/login`.

---

## 6. Frontend–backend integration checklist

- [ ] **Base URL:** Configure API base (e.g. `http://127.0.0.1:8000`) per environment.
- [ ] **Credentials:** Use `fetch(..., { credentials: 'include' })` (or Axios `withCredentials: true`) on every API request so session cookies are sent.
- [ ] **CSRF:** If the backend enforces CSRF for session auth, send `X-CSRFToken` from cookie (Django’s CSRF cookie name is `csrftoken`). For DRF + session auth, you may need to exempt API or send the token; confirm in backend.
- [ ] **Login:** POST to `/api/auth/login/` with email + password; on 200 save user (e.g. React state/context) and redirect to dashboard.
- [ ] **Register:** POST to `/api/auth/register/` with role and the right fields; on 201 redirect to login or dashboard.
- [ ] **Session check:** On app load, GET `/api/auth/me/`; 200 → consider user logged in, 401 → show login.
- [ ] **Logout:** POST `/api/auth/logout/`, then clear state and redirect to `/login`.
- [ ] **Predictions list:** GET `/api/predictions/` (patients: no query; providers: `?patient_id=<id>`).
- [ ] **Predict:** POST `/api/predict/<disease>/` with `{ "features": { ... } }`; providers can send `patient_id` in body.
- [ ] **Errors:** Show 400/401/404/503 messages (e.g. `response.json().detail`) in the UI.

---

## 7. Suggested folder structure (React + Vite)

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api/
│   │   └── client.js          # base URL, fetch with credentials
│   ├── context/
│   │   └── AuthContext.jsx    # user, login, logout, register
│   ├── routes/
│   │   └── (or use React Router in App)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx       # role step + form
│   │   ├── Dashboard.jsx
│   │   └── Predict.jsx
│   └── components/
│       ├── Layout.jsx
│       ├── RoleToggle.jsx
│       └── ...
└── public/
```

---

## 8. Next steps

1. **Backend:** Login/logout are added; ensure `CSRF_TRUSTED_ORIGINS` / CSRF handling for `http://localhost:3000` if needed.
2. **Scaffold frontend:** Run `npm create vite@latest frontend -- --template react`, then add router, auth context, and API client.
3. **Implement login and register pages** from mockups, then dashboard and predict, wiring all to the endpoints above.

If you tell me your preferred stack (e.g. “React + Vite” or “Next.js”), I can outline or generate the initial `api/client.js`, `AuthContext`, and Login/Register page code next.
