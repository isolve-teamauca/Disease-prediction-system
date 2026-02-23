# How to Run MedPredict (Disease Risk Prediction System)

## Prerequisites

- **Python 3.10+** (backend)
- **Node.js 18+** and npm (frontend)
- **PostgreSQL** with a database named `disease_prediction_db`
- **Heart dataset** for training: `heart.csv` in `backend/ml_models/data/` or `medical-ml-system/data/`

---

## 1. One-time setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
```

Copy environment file and set your DB credentials:

```bash
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux
```

Edit `.env`: set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, and `DJANGO_SECRET_KEY`.

Create the database in PostgreSQL (e.g. pgAdmin), then:

```bash
python manage.py migrate
python manage.py createsuperuser
```

### (Optional) Train heart model and get heart.pkl

Place `heart.csv` in `backend/ml_models/data/` (or use existing `medical-ml-system/data/heart.csv`). Then:

```bash
cd backend
.venv\Scripts\activate
python -m ml_models.train_heart
```

This writes `backend/ml_models/heart.pkl`. For other diseases (hypertension, stroke, diabetes), add or train models and place `hypertension.pkl`, `stroke.pkl`, `diabetes.pkl` in `backend/ml_models/`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` with:

```
VITE_API_BASE_URL=http://localhost:8000
```

---

## 2. Run the system

Use **two terminals**.

### Terminal 1 – Backend (Django)

```bash
cd backend
.venv\Scripts\activate
python manage.py runserver
```

- API: **http://127.0.0.1:8000**
- Admin: **http://127.0.0.1:8000/admin/** (use superuser from `createsuperuser`)

### Terminal 2 – Frontend (React)

```bash
cd frontend
npm run dev
```

- App: **http://localhost:3000**

---

## 3. Use the app

1. Open **http://localhost:3000**
2. **Register** (Patient or Healthcare Provider) or **Sign in**
3. **Patient:** Dashboard → “New Prediction” or quick action (e.g. Heart) → fill features → Run Prediction → view result and history
4. **Provider:** Dashboard → enter Patient ID → Search → view that patient’s predictions

---

## 4. Quick reference

| Component   | Command / URL |
|------------|----------------|
| Backend    | `cd backend && .venv\Scripts\activate && python manage.py runserver` |
| Frontend   | `cd frontend && npm run dev` |
| API root   | http://127.0.0.1:8000 |
| Frontend   | http://localhost:3000 |
| Train heart| `cd backend && python -m ml_models.train_heart` |
| Migrations | `cd backend && python manage.py migrate` |

---

## 5. Troubleshooting: "Prediction failed"

- **Model file not found / Service unavailable (503)**  
  The backend needs a trained model per disease (e.g. `heart.pkl` for heart). Put the `.pkl` file in `backend/ml_models/` or generate it:
  - From `backend/`: `python -m ml_models.train_heart` (requires `heart.csv` in `backend/ml_models/data/` or `medical-ml-system/data/`).
- **Patient not found (400)**  
  You must be signed in as a **patient** to run a prediction for yourself (or as a provider you must send a valid `patient_id`). If you registered as patient but see this, ensure you completed registration; the backend creates a Patient profile when role is patient.
- The website now shows the backend error message in the toast; read it to see the exact reason.

---

## 6. Docker (alternative)

From project root:

```bash
cd backend
copy .env.example .env
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

Backend runs on port 8000. Run the frontend locally with `npm run dev` and point it at `http://localhost:8000`.
