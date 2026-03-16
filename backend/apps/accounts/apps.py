import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Accounts"

    def ready(self):
        """Optional: preload ML models at startup to avoid first-request latency."""
        try:
            from ml_models.model_loader import load_all_models
            load_all_models()
        except Exception as e:
            logger.warning("ML models not preloaded at startup: %s", e)
