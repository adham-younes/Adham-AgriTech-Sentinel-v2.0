# Demo Account Setup

Use this guide to provision and share a read-only demo account so reviewers can explore the dashboard without creating their own credentials.

## 1. Required environment variables

Add these keys to `.env.local` and to every Vercel environment you deploy to:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL of the Supabase project (used by the client and server). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service key with elevated permissions. Required for seeding demo users and ingesting sensor data. **Store securely**. |
| `DEMO_USER_EMAIL` | Email address that reviewers will use to log into the demo account. |
| `DEMO_USER_PASSWORD` | Password for the demo account. Keep it non-sensitive and rotate it periodically. |
| `DEMO_USER_FULL_NAME` | Display name that appears inside the dashboard for the demo user. |
| `DEMO_USER_ROLE` | Role metadata for the demo user (e.g., `demo`, `manager`). |
| `SENSORS_API_KEY` | Shared secret used by IoT devices when calling the sensor ingestion API (`/api/sensors/ingest`). |

> ⚠️ Never commit `.env.local`. Rotate the service-role key if you suspect it has been exposed.

## 2. Seed (or update) the demo user

Run the helper script from the project root:

```bash
npx ts-node scripts/seed-demo-user.ts
```

The script uses `SUPABASE_SERVICE_ROLE_KEY` to create (or update) the demo account and ensures the password/metadata stay in sync. Re-run it any time you change the demo password or profile.

## 3. Share credentials securely

- Provide the email/password to reviewers through a secure channel (never hardcode it in the client bundle).
- Optionally add a “Try the demo” note on the login page that displays the email only; keep the password hidden.

## 4. Optional: automatic demo login

If you want a **Try Demo** button:

1. Create an API route (e.g., `app/api/auth/demo-login/route.ts`) that reads the demo credentials on the server, signs in via Supabase, and sets the auth cookie.
2. Call that endpoint from `/auth/login` so the credentials never reach the browser.

## 5. Resetting demo data

Seed example farms, fields, sensors, and soil analyses owned by the demo user so the dashboard looks alive. You can write SQL inserts under `scripts/migrations/` or use the Supabase dashboard. Repeat this whenever you need to refresh the showcase data.

## 6. Sensor ingestion quick reference

Use the following request format when simulating IoT devices:

```
POST /api/sensors/ingest
Headers:
  Content-Type: application/json
  x-api-key: <SENSORS_API_KEY>

Body:
{
  "sensorId": "SENSOR-123",
  "fieldId": "550e8400-e29b-41d4-a716-446655440000", // optional if sensor already registered
  "timestamp": "2025-01-01T10:00:00Z",
  "moisture": 42.5,
  "temperature": 26.3,
  "pH": 6.4,
  "salinity": 1.2,
  "batteryStatus": 88
}
```

Successful responses include `{ "code": "SENSOR_READING_RECORDED" }`. Validation errors return `422` with details, and missing/incorrect API keys return `401`.
