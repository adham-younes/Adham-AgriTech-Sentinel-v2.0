# Feature Flag Reference

This document describes the platform feature flags used to safely roll out the satellite automation roadmap.

| Flag | Default | Scope | Description |
| ---- | ------- | ----- | ----------- |
| `NEXT_PUBLIC_FEATURE_SATELLITE_AUTOMATION` | `false` | Client & API | Master switch for upcoming satellite-driven UI features. Keep `false` in production until automation is fully verified. |
| `NEXT_PUBLIC_FEATURE_SOIL_ANALYSIS_AUTOMATION` | `false` | API | Gates the `/api/soil-analysis/analyze-from-satellite` endpoint. When disabled the API returns `503` without touching existing workflows. |
| `NEXT_PUBLIC_FEATURE_SENTINEL_PIPELINE` | `false` | Server | Controls Sentinel Hub ingestion jobs. Use this to stage rollouts in preview deployments before enabling in production. |
| `NEXT_PUBLIC_FEATURE_SATELLITE_CACHE` | `true` | Shared | Toggles the upcoming caching layer for satellite responses. Set to `false` if you need to bypass cache during debugging. |

## Usage

```ts
import { isFeatureEnabled } from '@/lib/config/feature-flags'

if (isFeatureEnabled('soilAnalysisAutomation')) {
  // execute satellite-driven soil analysis pipeline
}
```

All flags default to the safest behaviour, so deployments remain stable even when the new automation code ships. Update `.env.local` (and remote secrets) only when you are ready to promote a specific feature.
