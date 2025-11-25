# NDVI Ingestion & Satellite Pipelines

This guide documents how satellite imagery is stored, how NDVI/EVI/NDWI are produced, and how to trigger the ingestion flow manually or on a schedule.

## Database schema

Migration `scripts/migrations/017_create_satellite_and_ndvi.sql` creates two tables:

1. `satellite_images` – keeps raw imagery metadata per field. Columns include `provider` (`Sentinel`, `ESD`, `Copernicus`, etc.), capture time, inline `image_url`/`file_path`, JSON `band_data`, and foreign keys to `field_id` + `user_id`.
2. `ndvi_indices` – stores derived vegetation indices per field/image with `ndvi_value`, `evi_value`, `ndwi_value`, timestamps, and `user_id`.

Row-Level Security (RLS) enforces `user_id = auth.uid()` across both tables.

## Environment variables

Set the Sentinel Hub credentials in `.env.local`, `.env.production`, and your hosted environments:

| Variable | Description |
| --- | --- |
| `SENTINEL_HUB_CLIENT_ID` | OAuth client ID from Sentinel Hub. |
| `SENTINEL_HUB_CLIENT_SECRET` | OAuth client secret. |
| `SENTINEL_HUB_CONFIG_ID` | Instance/config ID that points to your Sentinel data source. |

If any credential is missing, the ingestion pipeline logs a warning and falls back to deterministic mock data so development environments can still run.

## API endpoint

`POST /api/ndvi/update` ingests imagery for the signed-in user. Optional body parameters:

```json
{
  "field_id": "optional-field-uuid",
  "date": "2025-01-10T00:00:00.000Z"
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/ndvi/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -d '{"date":"2025-01-10T00:00:00.000Z"}'
```

The response returns `{ code, message, details }` with counters for processed, inserted, skipped, and failed fields.

## Scheduled script

Use `scripts/update-ndvi.ts` for cron/Vercel Scheduler jobs:

```bash
npx ts-node scripts/update-ndvi.ts --days=4
npx ts-node scripts/update-ndvi.ts --field=FIELD_UUID --date=2025-01-08
```

Flags:

- `--field=<uuid>` limits ingestion to a specific field.
- `--date=<ISO string>` uses an exact capture date.
- `--days=<n>` falls back to _n_ days ago when `--date` is omitted (default: 3).

The script authenticates with the Supabase service role key, iterates every field (or the specified one), and prints a JSON summary when complete.

## Index calculations

- **NDVI** uses `(NIR - RED) / (NIR + RED)` and is approximated by sampling the Sentinel PNG response; mock data produces deterministic values for repeatability.
- **EVI** and **NDWI** are derived heuristically from NDVI when raw bands are unavailable. Replace the formulas with band math once additional Sentinel bands are wired in.

## Testing

Unit tests in `__tests__/api/ndvi_update.test.ts` mock both the Sentinel fetcher and Supabase client to ensure:

- Successful runs insert rows into `satellite_images` and `ndvi_indices`.
- Missing coordinates or imagery result in skipped entries (no crashes).
- Insert failures are surfaced in the summary as `failed`.

Run the tests via your Jest command (e.g., `npx ts-node __tests__/api/ndvi_update.test.ts` while Jest is being wired up).

## Troubleshooting

- **Missing credentials:** Set the Sentinel env vars. Until then, the pipeline logs a warning and uses mock NDVI values.
- **RLS errors:** API calls must be authenticated; scripts must use the service role key. Every insert must set `user_id`.
- **No fields returned:** Ensure each field has latitude/longitude. Records without coordinates are skipped automatically.
