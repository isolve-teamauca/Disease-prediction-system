# ===================================
# Heart Disease Risk Prediction Model
# ===================================
# Pipeline: StandardScaler -> LogisticRegression. Fit on raw X; save entire pipeline as heart.pkl.

import os
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score


# ==========================
# 1. Load Data
# ==========================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "heart.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
# Backend ml_models: overwrite heart.pkl used by Django app
BACKEND_ML_DIR = os.path.join(BASE_DIR, "..", "backend", "ml_models")

df = pd.read_csv(DATA_PATH)

X = df.drop("target", axis=1)
y = df["target"]


# ==========================
# 2. Train-Test Split (raw X)
# ==========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)


# ==========================
# 3. Pipeline: scaler + classifier
# ==========================

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(max_iter=5000)),
])


# ==========================
# 4. Hyperparameter Tuning (fit on raw X)
# ==========================

param_grid = {
    "classifier__C": [0.01, 0.1, 1, 10, 100],
}

grid = GridSearchCV(
    pipeline,
    param_grid,
    cv=5,
    scoring="accuracy",
)

grid.fit(X_train, y_train)

best_pipeline = grid.best_estimator_

print("Best Parameters:", grid.best_params_)
print("Cross Validation Score:", grid.best_score_)


# ==========================
# 5. Evaluation (pipeline takes raw X)
# ==========================

y_pred = best_pipeline.predict(X_test)
y_proba = best_pipeline.predict_proba(X_test)[:, 1]

print("\nTest Accuracy:", accuracy_score(y_test, y_pred))
print("ROC-AUC:", roc_auc_score(y_test, y_proba))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))


# ==========================
# 6. Train Final Pipeline on FULL Raw Data
# ==========================

final_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(
        C=grid.best_params_["classifier__C"],
        max_iter=5000,
    )),
])

final_pipeline.fit(X, y)


# ==========================
# 7. Save Entire Pipeline (overwrite heart.pkl)
# ==========================

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(BACKEND_ML_DIR, exist_ok=True)

heart_pkl_path = os.path.join(BACKEND_ML_DIR, "heart.pkl")
joblib.dump(final_pipeline, heart_pkl_path)

# Also save in local models/ for reference
joblib.dump(final_pipeline, os.path.join(MODEL_DIR, "heart_model.pkl"))

print("\nPipeline saved successfully!")
print(f"  - {heart_pkl_path} (overwritten, used by backend)")
print(f"  - {os.path.join(MODEL_DIR, 'heart_model.pkl')}")
