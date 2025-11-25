# Tasks API

The Tasks API lets growers and agronomy teams create, update, list, and delete agronomic tasks (irrigation, fertilisation, pest control, etc.) that are linked to specific fields. Tasks power the dashboard widgets, reminders, and AI assistant workflows.

## Database schema

Migration `scripts/migrations/016_create_tasks.sql` creates the `public.tasks` table with Row-Level Security enforced by Supabase. Key columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key (`gen_random_uuid()`). |
| `field_id` | `uuid` | References `public.fields(id)` with `on delete cascade`. |
| `user_id` | `uuid` | References `public.profiles(id)`; populated with the authenticated user. |
| `name` | `varchar(100)` | Required task title. |
| `description` | `text` | Optional details. |
| `due_date` | `date` | Optional due date. |
| `status` | `varchar(20)` | Enum constraint (`pending`, `in_progress`, `completed`). |
| `recommendations` | `jsonb` | Stores structured guidance (defaults to `{}`). |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed timestamps. |

Policies ensure a user can only see or mutate tasks tied to their fields/farms.

## API endpoints

All endpoints live under `/api/tasks` and return a JSON envelope containing `code`, `message`, and optional `details`. Authentication is required; the Supabase session determines access.

### List tasks

```
GET /api/tasks?field_id=<uuid>
```

Returns all tasks owned by the user; optionally filter by `field_id`.

Example:

```bash
curl -X GET "http://localhost:3000/api/tasks?field_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>"
```

### Create task

```
POST /api/tasks
Content-Type: application/json
```

Payload:

```json
{
  "field_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "name": "Irrigation cycle",
  "description": "Flush drip lines for 20 minutes",
  "due_date": "2025-01-20",
  "status": "pending",
  "recommendations": {
    "threshold": "Soil moisture < 30%"
  }
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -d '{"field_id":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee","name":"Irrigation cycle"}'
```

### Update task

```
PUT /api/tasks/<taskId>
```

Send only the fields that need to change (e.g., `status`, `description`, `recommendations`). The API enforces valid statuses and ownership.

```bash
curl -X PUT http://localhost:3000/api/tasks/11111111-2222-3333-4444-555555555555 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -d '{"status":"completed","recommendations":{"note":"Verified in-field"}}'
```

### Delete task

```
DELETE /api/tasks/<taskId>
```

Example:

```bash
curl -X DELETE http://localhost:3000/api/tasks/11111111-2222-3333-4444-555555555555 \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>"
```

## Configuration

No additional environment variables are needed beyond the existing Supabase settings. Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` remain configured so the API can validate sessions and run migrations.
