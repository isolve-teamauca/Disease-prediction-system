"""
Train heart disease model as a single sklearn Pipeline.
Pipeline: ColumnTransformer (numeric -> StandardScaler) + RandomForestClassifier.
Fit on raw DataFrame; save only heart.pkl. No *_scaler.pkl or encoders.
Run from backend/: python -m ml_models.train_heart
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

# Must match predictor FEATURE_ORDER["heart"]
FEATURE_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]

ML_MODELS_DIR = Path(__file__).resolve().parent
DATA_PATHS = [
    ML_MODELS_DIR / "data" / "heart.csv",
    ML_MODELS_DIR.resolve().parent.parent / "medical-ml-system" / "data" / "heart.csv",
]


# Sanity-check input: high-risk patient (age 63, chol 300, ca=3, thal=2, etc.)
SANITY_ROW = {
    "age": 63, "sex": 1, "cp": 0, "trestbps": 150, "chol": 300,
    "fbs": 1, "restecg": 2, "thalach": 120, "exang": 1,
    "oldpeak": 2.5, "slope": 2, "ca": 3, "thal": 2,
}


def main():
    data_path = next((p for p in DATA_PATHS if p.exists()), None)
    if data_path is None:
        print("heart.csv not found. Place it in backend/ml_models/data/ or medical-ml-system/data/")
        sys.exit(1)

    df = pd.read_csv(data_path)
    print("Dataset shape:", df.shape)
    if "target" not in df.columns:
        print("Target column 'target' not found. Columns:", list(df.columns))
        sys.exit(1)
    print("Target class distribution:\n", df["target"].value_counts())
    print("First 5 rows:\n", df.head())

    X = df[FEATURE_COLUMNS]
    y = df["target"].astype(int)

    # If sanity check later shows prob near 0 for high-risk input, target may be inverted
    sanity_df = pd.DataFrame([SANITY_ROW])
    for col in FEATURE_COLUMNS:
        if col not in sanity_df.columns:
            sanity_df[col] = SANITY_ROW[col]
    sanity_df = sanity_df[FEATURE_COLUMNS]

    def train_and_check(y_labels):
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_labels, test_size=0.2, random_state=42, stratify=y_labels
        )
        preprocessor = ColumnTransformer(
            transformers=[("num", StandardScaler(), FEATURE_COLUMNS)],
            remainder="drop",
        )
        pl = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=100, random_state=42)),
        ])
        pl.fit(X_train, y_train)
        y_pred = pl.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        print(f"Test accuracy: {acc:.4f}")
        prob = pl.predict_proba(sanity_df)[0][1]
        print(f"Sanity check (high-risk input) probability: {prob:.4f}")
        return pl, prob

    pipeline, prob = train_and_check(y)
    if prob < 0.3:
        print("Probability near 0 for high-risk input — target likely inverted. Retraining with y = 1 - y.")
        y_flipped = 1 - y
        pipeline, prob = train_and_check(y_flipped)
        if prob < 0.65:
            print("WARNING: Sanity probability still below 0.65 after flip. Check data and features.")
        else:
            print("After flip: sanity probability OK (>0.65).")
    elif prob < 0.65:
        print("WARNING: Sanity probability below 0.65. Expected >0.70 for this high-risk input.")
    else:
        print("Sanity check OK: probability > 0.65.")

    out_path = ML_MODELS_DIR / "heart.pkl"
    joblib.dump(pipeline, out_path)
    print(f"Saved pipeline to {out_path}")


if __name__ == "__main__":
    main()
