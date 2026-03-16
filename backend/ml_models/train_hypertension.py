"""
Train hypertension model as a single sklearn Pipeline.
Pipeline: ColumnTransformer (StandardScaler for numeric) + RandomForestClassifier.
Fit on raw DataFrame; save only hypertension.pkl. No separate scaler/encoder files.
Run from backend/: python -m ml_models.train_hypertension
"""
import sys
from pathlib import Path

import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Must match predictor FEATURE_ORDER["hypertension"] exactly (13 features)
FEATURE_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]

ML_MODELS_DIR = Path(__file__).resolve().parent
DATA_PATHS = [
    ML_MODELS_DIR / "data" / "hypertension.csv",
    ML_MODELS_DIR.resolve().parent.parent / "medical-ml-system" / "data" / "hypertension.csv",
]

TARGET_COLUMNS = ["target", "hypertension", "Outcome", "outcome"]


def main():
    print("FEATURE_COLUMNS (must match predictor.FEATURE_ORDER['hypertension']):", FEATURE_COLUMNS)
    print("Count:", len(FEATURE_COLUMNS))

    data_path = next((p for p in DATA_PATHS if p.exists()), None)
    if data_path is None:
        print("hypertension.csv not found. Place it in backend/ml_models/data/ or medical-ml-system/data/")
        sys.exit(1)

    df = pd.read_csv(data_path)
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    target_col = next((c for c in TARGET_COLUMNS if c in df.columns), None)
    if target_col is None:
        print(f"Target column not found. Expected one of {TARGET_COLUMNS}. Columns: {list(df.columns)}")
        sys.exit(1)

    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    if missing:
        print(f"Missing feature columns: {missing}. Available: {list(df.columns)}")
        sys.exit(1)

    X = df[FEATURE_COLUMNS]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[("num", StandardScaler(), FEATURE_COLUMNS)],
        remainder="drop",
    )
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test accuracy: {acc:.4f}")

    out_path = ML_MODELS_DIR / "hypertension.pkl"
    joblib.dump(pipeline, out_path)
    print(f"Saved pipeline to {out_path}")


if __name__ == "__main__":
    main()
