# MedPredict — Disease Risk Prediction System

## Creating an admin user

Admin accounts **cannot** be created from the registration page. They are created from the **backend** (Django shell).

From the **backend** directory (where `manage.py` is), run:

```bash
python manage.py shell -c "
from apps.accounts.models import User
u = User.objects.create_superuser('admin', 'admin@medpredict.com', 'admin123')
u.role = 'admin'
u.save()
"
```

**Sign in:** On the **Login** page, choose **Admin**, then use the **exact same email** you used in the command below (and password `admin123`). The email is case-sensitive.

- Example: if you used `admin@medpredict.com` in the command, sign in with **admin@medpredict.com** (not `admin@predict.com`).

To use a different email (e.g. `admin@predict.com`), use it in the command:

```bash
python manage.py shell -c "
from apps.accounts.models import User
u = User.objects.create_superuser('admin', 'admin@predict.com', 'admin123')
u.role = 'admin'
u.save()
"
```

Then sign in with that email and `admin123`.
