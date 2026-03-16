"""
Train stroke model as a single sklearn Pipeline.
Pipeline: ColumnTransformer (StandardScaler for numeric, OneHotEncoder for categorical if any) + RandomForestClassifier.
Fit on raw DataFrame; save only stroke.pkl. No separate scaler/encoder files.
Run from backend/: python -m ml_models.train_stroke
"""
import sys
from pathlib import Path

import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Must match predictor FEATURE_ORDER["stroke"]
FEATURE_COLUMNS = [
    "gender",
    "age",
    "hypertension",
    "heart_disease",
    "ever_married",
    "work_type",
    "residence_type",
    "avg_glucose_level",
    "bmi",
    "smoking_status",
]

ML_MODELS_DIR = Path(__file__).resolve().parent
DATA_PATHS = [
    ML_MODELS_DIR / "data" / "stroke.csv",
    ML_MODELS_DIR.resolve().parent.parent / "medical-ml-system" / "data" / "stroke.csv",
]

TARGET_COLUMNS = ["stroke", "target", "Outcome", "outcome"]


def main():
    data_path = next((p for p in DATA_PATHS if p.exists()), None)
    if data_path is None:
        print("stroke.csv not found. Place it in backend/ml_models/data/ or medical-ml-system/data/")
        sys.exit(1)

    df = pd.read_csv(data_path)
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    if "residence_type" not in df.columns and "residence type" in df.columns:
        df = df.rename(columns={"residence type": "residence_type"})

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

    # Split into numeric and categorical (object/category dtypes)
    numeric_cols = [c for c in FEATURE_COLUMNS if pd.api.types.is_numeric_dtype(X_train[c])]
    categorical_cols = [c for c in FEATURE_COLUMNS if c not in numeric_cols]

    transformers = []
    if numeric_cols:
        transformers.append(("num", StandardScaler(), numeric_cols))
    if categorical_cols:
        transformers.append(("cat", OneHotEncoder(drop="first", handle_unknown="ignore"), categorical_cols))

    preprocessor = ColumnTransformer(
        transformers=transformers,
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

    out_path = ML_MODELS_DIR / "stroke.pkl"
    joblib.dump(pipeline, out_path)
    print(f"Saved pipeline to {out_path}")


if __name__ == "__main__":
    main()
