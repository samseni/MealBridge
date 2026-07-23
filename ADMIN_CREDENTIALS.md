# MealBridge Admin Credentials

## Default Admin Account

**Email:** `admin@mealbridge.com`
**Password:** `default`

---

## How to Access Admin Dashboard

1. Go to http://localhost:5173/login
2. Enter the credentials above
3. You will be redirected to the admin dashboard at `/admin-dashboard`

---

## Admin Features

- **Dashboard (`/admin-dashboard`):** View platform statistics and metrics
- **Users (`/admin/users`):** Complete user management with search, filters, and suspend/activate
- **Verifications (`/admin/verifications`):** Review and approve/reject NGO verification requests
- **Reports (`/admin/reports`):** Platform analytics with date range filtering and CSV/PDF export

---

## Important Notes

⚠️ **Security Warning:** Change the default admin password in production!

To change the admin password, run:
```sql
-- Login to PostgreSQL
PGPASSWORD=password psql -h localhost -U postgres -d mealbridge

-- Update password (hash it first using bcrypt)
UPDATE users
SET password_hash = '$2b$10$YOUR_NEW_BCRYPT_HASH'
WHERE email = 'admin@mealbridge.com';
```

---

## Quick Database Commands

### View all admins:
```bash
PGPASSWORD=password psql -h localhost -U postgres -d mealbridge -c "
SELECT id, name, email, role FROM users WHERE role = 'admin';
"
```

### Approve NGO verification:
```bash
PGPASSWORD=password psql -h localhost -U postgres -d mealbridge -c "
UPDATE users SET verification = 'approved' WHERE id = [NGO_ID];
"
```

### View all pending NGO verifications:
```bash
PGPASSWORD=password psql -h localhost -U postgres -d mealbridge -c "
SELECT id, name, email, org_name, verification
FROM users
WHERE role = 'ngo' AND verification = 'pending';
"
```