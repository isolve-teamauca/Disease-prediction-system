# Manual test: Provider prediction flow

<!--
Quick manual checklist for verifying provider predict: login as provider,
get patient_id from Patient Dashboard, submit prediction, check success and error cases.
-->

## 1. Log in as a provider

- Open the app (e.g. http://localhost:5173) and go to **Login**.
- Use demo provider credentials:
  - **Email/username:** `demo_provider`
  - **Password:** `demo123`
- Submit; you should land on the Provider Dashboard.

(If the demo user does not exist, create a user with role **Healthcare Provider** via Register or Django admin.)

---

## 2. Get a valid patient_id (patient code)

- In another browser (or incognito), log in as a **patient** (e.g. `demo_patient` / `demo123`).
- Go to **Patient Dashboard**.
- Find the **Patient code** (sometimes labeled “Share with your doctor” or similar). This is the **patient_id** (e.g. a number like `5`).
- Copy that value — you will use it in step 3 as `patient_id`.

Alternatively, run `python ml_models/seed_demo_data.py` and use the printed “DEMO PATIENT CODE” as the patient_id.

---

## 3. Submit a prediction as a provider using that patient_id

- While logged in as the **provider**, go to a predict page (e.g. **Predict** → **Heart Disease**).
- In the **Verify Patient** section:
  - Enter the **patient_id** (patient code) from step 2.
  - Click **Verify**.
  - Confirm that the UI shows the patient’s name and ID (e.g. “Verified: Demo Patient (ID: 5)”).
- Fill in the clinical **features** (e.g. age, sex, chest pain type, etc.) with valid numbers.
- Click **Run Prediction**.
- The request sent is: `POST /api/predict/heart/` with body  
  `{ "features": { ... }, "patient_id": "<patient_code>" }`.

---

## 4. Successful response

- **Status:** `201 Created`.
- **Body** should include at least:
  - `prediction`: `0` or `1`
  - `probability`: number between 0 and 1 (e.g. `0.42`)
  - `risk_level`: one of `"Low"`, `"Moderate"`, `"High"`, `"Critical"`
  - Optionally: `risk_color`, `risk_advice`
- The UI should show the risk percentage, risk level badge, and recommendation.

---

## 5. Invalid or missing patient_id (expected 400)

**5a) Provider sends no patient_id**

- As provider, call `POST /api/predict/heart/` with body **only** `{ "features": { ... } }` (no `patient_id`).
- **Expected:** HTTP **400**.
- **Expected body** should include:
  - `"error": "Providers must include patient_id in the request body."`
  - `"hint": "Send { features: {...}, patient_id: '<patient_code>' } in the request."`

**5b) Provider sends invalid patient_id**

- As provider, call `POST /api/predict/heart/` with body  
  `{ "features": { ... }, "patient_id": 99999 }` (non‑existent ID).
- **Expected:** HTTP **400**.
- **Expected body:** e.g. `"detail": "Patient not found. Sign in as a patient or provide a valid patient_id (for providers)."`
