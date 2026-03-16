import joblib

model = joblib.load("ml_models/heart.pkl")
print(model)
print(type(model))
