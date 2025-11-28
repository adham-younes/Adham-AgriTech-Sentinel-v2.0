# Environment Variables

## Required Environment Variables

### EOSDA API Configuration
```bash
# EOSDA API Key (Required for satellite imagery)
# Format: apk.xxxxx
EOSDA_API_KEY=apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232

# Public EOSDA API Key (for client-side usage)
NEXT_PUBLIC_EOSDA_API_KEY=apk.cefa9921669b0857be282894813d1213ed88c5e8299e29a5e91db105464aa232

# EOSDA API Base URL (optional, defaults to https://api-connect.eos.com)
EOSDA_API_BASE_URL=https://api-connect.eos.com

# EOSDA API Mode (optional: 'connect' or 'api')
EOSDA_API_MODE=connect
```

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Mapbox Configuration (Optional - fallback)
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
NEXT_PUBLIC_MAPBOX_STYLE=satellite-v9
```

### Other Optional Variables
```bash
# Sentinel Hub (optional)
NEXT_PUBLIC_SENTINEL_TILE_URL=your_sentinel_url
NEXT_PUBLIC_DISABLE_SENTINEL=false

# MapTiler (optional)
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_key
```

## Vercel Deployment

Add these variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables above
3. Make sure to add them for all environments (Production, Preview, Development)

## Important Notes

- **EOSDA API Key**: Must use `X-Api-Key` header format (not query parameter, not Bearer)
- **Public vs Private**: `NEXT_PUBLIC_*` variables are exposed to the browser
- **Security**: Never commit `.env` files to git

