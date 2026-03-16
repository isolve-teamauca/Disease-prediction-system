import os
import joblib
import numpy as np
import pandas as pd


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "heart_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)


FEATURE_NAMES = [
    "age", "sex", "cp", "trestbps", "chol",
    "fbs", "restecg", "thalach", "exang",
    "oldpeak", "slope", "ca", "thal"
]


def predict_heart_disease(input_data):

    input_df = pd.DataFrame([input_data], columns=FEATURE_NAMES)
    input_scaled = scaler.transform(input_df)

    prediction = model.predict(input_scaled)[0]
    probability = model.predict_proba(input_scaled)[0][1]

    return prediction, probability


if __name__ == "__main__":

    sample = [30, 0, 1, 110, 150, 0, 0, 180, 0, 0.0, 2, 0, 1]



    pred, prob = predict_heart_disease(sample)

    print("Has Heart Disease:", pred)
    print("Probability of Heart Disease:", prob)
