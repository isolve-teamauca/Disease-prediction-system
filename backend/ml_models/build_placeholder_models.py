"""
Build and save placeholder .pkl models (RandomForest only, no scipy).
Uses tiny synthetic data so no CSV files are needed. Use this to replace
old LogisticRegression .pkl files that trigger scipy DLL load errors on Windows.

Run from backend/ (without Django): python ml_models/build_placeholder_models.py
If you get "DLL load failed... _distance_wrap" when running this script, run it
on another machine (or VM) without the App Control policy, then copy the four
.pkl files into backend/ml_models/ and restart the server.
"""
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Must match predictor FEATURE_ORDER for each disease
FEATURES = {
    "heart": [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
        "thalach", "exang", "oldpeak", "slope", "ca", "thal",
    ],
    "hypertension": [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
        "thalach", "exang", "oldpeak", "slope", "ca", "thal",
    ],
    "diabetes": [
        "pregnancies", "glucose", "blood_pressure", "skin_thickness",
        "insulin", "bmi", "diabetes_pedigree_function", "age",
    ],
    "stroke": [
        "gender", "age", "hypertension", "heart_disease", "ever_married",
        "work_type", "residence_type", "avg_glucose_level", "bmi", "smoking_status",
    ],
}

ML_MODELS_DIR = Path(__file__).resolve().parent
RNG = np.random.default_rng(42)


def _synthetic_data(columns, n=200):
    """Minimal numeric data so pipeline can fit (all columns numeric)."""
    data = {}
    for c in columns:
        if c in ("age", "trestbps", "chol", "thalach", "oldpeak", "pregnancies",
                 "glucose", "blood_pressure", "skin_thickness", "insulin", "bmi",
                 "diabetes_pedigree_function", "avg_glucose_level"):
            if c == "age":
                data[c] = RNG.integers(25, 80, size=n)
            elif c == "oldpeak":
                data[c] = RNG.uniform(0, 4, size=n)
            elif c == "bmi":
                data[c] = RNG.uniform(18, 45, size=n)
            elif c == "diabetes_pedigree_function":
                data[c] = RNG.uniform(0.1, 2.0, size=n)
            elif c == "avg_glucose_level":
                data[c] = RNG.uniform(80, 250, size=n)
            else:
                data[c] = RNG.uniform(50, 200, size=n).astype(np.float64)
        else:
            # discrete 0/1 or 0-3
            max_val = 2 if c in ("sex", "fbs", "exang", "gender", "hypertension", "heart_disease", "ever_married", "residence_type") else 4
            data[c] = RNG.integers(0, max(1, max_val), size=n)
    return pd.DataFrame(data)


def main():
    for disease, columns in FEATURES.items():
        df = _synthetic_data(columns)
        y = RNG.integers(0, 2, size=len(df))
        X = df[columns]

        preprocessor = ColumnTransformer(
            transformers=[("num", StandardScaler(), columns)],
            remainder="drop",
        )
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
        ])
        pipeline.fit(X, y)
        out_path = ML_MODELS_DIR / f"{disease}.pkl"
        joblib.dump(pipeline, out_path)
        print(f"Saved {out_path}")

    print("Done. Restart the backend server; predictions will use these models (no scipy).")


if __name__ == "__main__":
    main()
