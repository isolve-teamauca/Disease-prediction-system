"""
Loads sklearn .pkl models from disk.
Caching disabled for debugging: models are loaded fresh on each request.
"""
import logging
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)

# Absolute path to project root (backend directory when manage.py lives there)
BASE_DIR = Path(settings.BASE_DIR).resolve()

# Disease slug (API) -> filename in this folder. Use these exact names to avoid confusion.
DISEASE_HEART = "heart"
DISEASE_HYPERTENSION = "hypertension"
DISEASE_STROKE = "stroke"
DISEASE_DIABETES = "diabetes"

DISEASE_MODEL_FILENAMES = {
    DISEASE_HEART: "heart.pkl",
    DISEASE_HYPERTENSION: "hypertension.pkl",
    DISEASE_STROKE: "stroke.pkl",
    DISEASE_DIABETES: "diabetes.pkl",
}
# One Pipeline .pkl per disease only. No *_scaler.pkl or *_encoders.pkl.
MODEL_FILES = DISEASE_MODEL_FILENAMES


def _log_model_type(model, disease: str) -> None:
    """Log the loaded model type (Pipeline vs raw estimator) for the given disease."""
    model_type = type(model).__name__
    if hasattr(model, "named_steps"):
        logger.info("Loaded model type: %s (Pipeline, disease=%s)", model_type, disease)
    else:
        logger.info("Loaded model type: %s (raw estimator, disease=%s)", model_type, disease)


def get_model(disease: str):
    """
    Load and return the model for the given disease from disk.
    No cache: loads fresh every time (for debugging).
    """
    disease = disease.lower().strip()
    if disease not in DISEASE_MODEL_FILENAMES:
        raise ValueError(f"Unsupported disease: {disease}. Supported: {list(DISEASE_MODEL_FILENAMES)}")
    return _load_model(disease)


def _load_model(disease: str):
    """Load a single model from disk (no caching)."""
    import joblib

    filename = DISEASE_MODEL_FILENAMES[disease]
    model_path = BASE_DIR / "ml_models" / filename
    if not model_path.exists():
        abs_path = model_path.resolve()
        raise FileNotFoundError(
            f"Model file not found: {abs_path}. Place {filename} in the ml_models directory (under BASE_DIR)."
        )
    model = joblib.load(model_path)
    logger.info("Loaded model for disease=%s from %s", disease, model_path.resolve())
    _log_model_type(model, disease)
    return model


def load_all_models() -> dict:
    """
    Load all supported models from disk. Returns dict of disease -> model.
    No caching. Skips missing files and logs a warning.
    """
    import joblib

    loaded = {}
    for disease, filename in DISEASE_MODEL_FILENAMES.items():
        model_path = BASE_DIR / "ml_models" / filename
        if not model_path.exists():
            logger.warning("Model file not found: %s (place %s in ml_models/)", model_path.resolve(), filename)
            continue
        try:
            model = joblib.load(model_path)
            loaded[disease] = model
            logger.info("Loaded model for disease=%s from %s", disease, model_path.resolve())
            _log_model_type(model, disease)
        except Exception as e:
            logger.warning("Failed to load %s: %s", model_path, e)
    return loaded
