#!/usr/bin/env bash
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

python manage.py shell -c "
from apps.accounts.models import User
if not User.objects.filter(username='admin').exists():
    u = User.objects.create_superuser('admin', 'admin@medpredict.com', 'Admin@2026')
    u.role = 'admin'
    u.save()
    print('Admin created')
else:
    print('Admin exists')
"
