# ML Models

One **sklearn Pipeline** `.pkl` per disease. Each pipeline includes preprocessing (e.g. `ColumnTransformer` + `StandardScaler`) and the classifier. **Use these exact filenames:**

| Filename           | Disease        | API slug      |
|--------------------|----------------|---------------|
| `heart.pkl`        | Heart disease  | `heart`       |
| `hypertension.pkl` | Hypertension   | `hypertension`|
| `stroke.pkl`       | Stroke         | `stroke`      |
| `diabetes.pkl`     | Diabetes       | `diabetes`    |

**Do not use** `*_scaler.pkl`, `*_encoders.pkl`, or `encoders.pkl`; delete them if present. Inference uses only `get_model(disease)` and calls `model.predict(input_df)` / `model.predict_proba(input_df)`.

**Service layer:**

- **model_loader.py** – Loads one Pipeline per disease: `get_model(disease)`, `load_all_models()`.
- **predictor.py** – Builds a single-row DataFrame from request features, runs `model.predict` / `model.predict_proba`, returns `prediction`, `probability`, `risk_level`.

Feature names and column order in the API must match the pipeline’s training columns (see `FEATURE_ORDER` in `predictor.py`).

**Where do prediction results come from?**  
The app uses whatever `.pkl` files are in this folder. If you trained models with `train_heart.py`, `train_hypertension.py`, etc., and saved them here, then the results are from **your** trained models. If you use placeholder models from `build_placeholder_models.py`, results are from those (trained on small synthetic data).

**Troubleshooting: "X has 13 features, but RandomForestClassifier is expecting 10"**  
The `.pkl` for that disease was trained with a different number of features than the app sends. Fix it by retraining so the saved model matches: **Hypertension** must be trained with **13** features: `age`, `sex`, `cp`, `trestbps`, `chol`, `fbs`, `restecg`, `thalach`, `exang`, `oldpeak`, `slope`, `ca`, `thal`. Ensure your `hypertension.csv` has all of these columns, then run `python -m ml_models.train_hypertension` from the `backend/` directory. Or run `python ml_models/build_placeholder_models.py` (on a machine without DLL block) and copy the new `.pkl` files into `ml_models/`.
