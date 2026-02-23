# MedPredict — Disease Risk Prediction System

## Creating an admin user

To create a user with the **admin** role (for access to the Admin Dashboard at `/admin-dashboard` and the stats API at `GET /api/admin/stats/`), run the following from the **backend** directory (where `manage.py` lives):

```bash
python manage.py shell -c "
from apps.accounts.models import User
u = User.objects.create_superuser('admin', 'admin@medpredict.com', 'admin123')
u.role = 'admin'
u.save()
"
```

Then sign in with `admin@medpredict.com` / `admin123` (or the username `admin` and that password) to be redirected to the Admin Dashboard.
