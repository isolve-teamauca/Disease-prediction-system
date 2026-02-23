# MedPredict Frontend

React + Vite + Tailwind CSS frontend for the Disease Risk Prediction System.

## Setup

```bash
cd frontend
npm install
```

## Environment

Create or edit `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Run

1. Start the Django backend: `cd backend && python manage.py runserver` (port 8000).
2. Start the frontend:

```bash
npm run dev
```

Open http://localhost:3000. Use **Login** or **Register**; then as a patient you can run predictions and view history; as a provider you can search by patient ID and view their predictions.

## Build

```bash
npm run build
npm run preview
```

## Stack

- React 18, Vite, Tailwind CSS
- React Router v6, Axios (with CSRF + session auth)
- Lucide React, Recharts, React Hot Toast
