# Disease Risk Prediction System – Backend (MedPredict)

Django REST API with PostgreSQL (`disease_prediction_db`). Predicts **Heart Disease**, **Hypertension**, **Stroke**, **Diabetes** using sklearn `.pkl` models.

## Project structure

```
backend/
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── ml_models/                    # Project root: .pkl files + service layer
│   ├── __init__.py
│   ├── model_loader.py           # Loads models once at startup / first use
│   ├── predictor.py              # Inference + risk level (Low/Medium/High)
│   ├── README.md
│   └── heart.pkl, hypertension.pkl, stroke.pkl, diabetes.pkl  (you add these)
├── apps/
│   ├── __init__.py
│   ├── accounts/                 # Custom User (role: patient / provider)
│   │   ├── models.py, admin.py, serializers.py, views.py, urls.py
│   │   └── migrations/
│   ├── patients/                 # Patient profile (OneToOne User)
│   │   ├── models.py, admin.py, serializers.py, views.py, urls.py
│   │   └── migrations/
│   └── predictions/              # Prediction records + predict endpoint
│       ├── models.py, admin.py, serializers.py, views.py, urls.py, predict_urls.py
│       └── migrations/
└── templates/
    └── base.html
```

## Setup (local)

1. **Virtualenv and deps**
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```

2. **Environment**  
   Copy `.env.example` to `.env` and set `POSTGRES_*` and `DJANGO_SECRET_KEY`.

3. **Database**  
   Create `disease_prediction_db` in PostgreSQL (e.g. pgAdmin), then:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **ML models**  
   Place your trained `.pkl` files in `backend/ml_models/`:
   - `heart.pkl`
   - `hypertension.pkl`
   - `stroke.pkl`
   - `diabetes.pkl`

5. **Run**
   ```bash
   python manage.py runserver
   ```
   - Admin: http://127.0.0.1:8000/admin/
   - API: http://127.0.0.1:8000/api/

**Note:** If you had an older backend with `users` app and old `predictions` schema, use a **fresh database** or drop existing tables and re-run `migrate` so the new `accounts` / `patients` / `predictions` schema applies.

## API overview

| Purpose | Method | Endpoint | Auth | Body / params |
|--------|--------|----------|------|----------------|
| Register | POST | `/api/auth/register/` | No | `username`, `email`, `password`, `role` (`patient`/`provider`), `full_name`, `phone`, etc. |
| Current user | GET | `/api/auth/me/` | Yes | - |
| Patient profile | GET | `/api/patients/me/` | Yes (patient) | - |
| **Predict** | **POST** | **`/api/predict/<disease>/`** | Yes | `features`: `{ "feature_name": value, ... }`; providers can send `patient_id` |
| List predictions | GET | `/api/predictions/` | Yes | Patients: own list. Providers: `?patient_id=<id>` |
| Prediction detail | GET | `/api/predictions/<id>/` | Yes | - |

**Supported diseases:** `heart`, `hypertension`, `stroke`, `diabetes`.

**Predict response:** `{ "prediction": 0|1, "probability": float, "risk_level": "Low"|"Medium"|"High" }`  
Each request also **saves** a row in `predictions_prediction` (patient, disease_type, probability, prediction, risk_level, created_at).

## Environment variables (.env)

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | True / False |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts |
| `POSTGRES_DB` | Database name (e.g. `disease_prediction_db`) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | DB credentials |
| `POSTGRES_HOST`, `POSTGRES_PORT` | DB host/port |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins |

## Service layer (ml_models/)

- **model_loader.py** – `get_model(disease)`, `load_all_models()`; loads `.pkl` once and caches.
- **predictor.py** – `predict_disease(disease, features)` → `prediction`, `probability`, `risk_level`.

Models are preloaded at Django startup (in `accounts` app `ready()`); missing files are logged and lazy-loaded on first predict.
