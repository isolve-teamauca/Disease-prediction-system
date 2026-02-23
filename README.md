## MedPredict (Full Stack)

This repo contains a **React (JavaScript) frontend** and a **Python (FastAPI) backend** that match the MedPredict UI you shared (patient portal + healthcare provider dashboard).

Authentication is **real**:
- accounts are stored in a local **SQLite** DB (`backend/medpredict.db`)
- passwords are **hashed (bcrypt)**
- login returns a **JWT** token

### 1) Start the backend
> Install Python 3.10+ from python.org and enable **“Add to PATH”**.

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend docs: `http://localhost:8000/api/docs`

### Option A) Frontend dev server (uses port 5173)
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`

### Option B) Single-port mode (ONLY `localhost:8000`)
Build the frontend, then the backend serves it automatically:

```bash
cd frontend
npm install
npm run build
```

Now start the backend (same as step 1) and open:
- App: `http://localhost:8000`
- API docs: `http://localhost:8000/api/docs`

### If `pip install` can’t access the internet (fallback)
If you can’t install Python packages from PyPI, you can still run everything on port 8000 with the **standard library** server:

```bash
cd frontend
npm install
npm run build

cd ..\\backend
python server.py
```

Open: `http://localhost:8000`

## ML prediction models (.pkl)

### 1) Put model files here
Copy these files into `backend/models/`:
- `diabetes_model.pkl`
- `diabetes_scaler.pkl`
- `stroke_model.pkl`
- `stroke_scaler.pkl`
- `stroke_encoders.pkl`

### 2) Start the ML service (localhost-only)
This runs on `127.0.0.1:8001` and is proxied through the main server at `localhost:8000`.

```bash
cd backend
python -m venv .venv-ml
.\.venv-ml\Scripts\activate
pip install -r ml_service\requirements.txt
python -m uvicorn ml_service.app:app --host 127.0.0.1 --port 8001
```

### 3) Use it from the app
Open `http://localhost:8000/provider/risk-assessment` to see Diabetes + Stroke prediction forms.

### Flows
- **Patient**: login → patient dashboard / health tracking / trends / assistant
- **Provider**: login → overview / patients / risk assessment / analytics

