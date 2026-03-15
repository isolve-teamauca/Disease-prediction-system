#!/usr/bin/env bash
# Run migrations against the runtime database (PostgreSQL on Render).
# On Render, DATABASE_URL is only available at runtime, not during build,
# so we must migrate here to create tables like accounts_user.
set -o errexit
python manage.py migrate --noinput
exec gunicorn config.wsgi:application "$@"
