## MedPredict Backend (FastAPI)

### Requirements
- Python 3.10+ installed

### Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Run
```bash
uvicorn app.main:app --reload --port 8000
```

### API Docs
Open `http://localhost:8000/api/docs`

