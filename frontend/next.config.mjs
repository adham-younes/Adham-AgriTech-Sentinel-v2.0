import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// IMPORTANT: Never leak the private EOSDA_API_KEY to the browser.
// Only allow explicitly public tile keys (if you have a separate tiles-only key).
const eosdaPublicKey =
  process.env.NEXT_PUBLIC_EOSDA_TILE_API_KEY ??
  process.env.NEXT_PUBLIC_EOSDA_API_KEY ??
  process.env.EOSDA_TILE_API_KEY ??
  "";

// Consider EOSDA configured if a server-side key exists OR a public tile key exists
const isEosdaConfigured = Boolean(process.env.EOSDA_API_KEY || eosdaPublicKey);

// Default provider is EOSDA only when a public tile key is available; otherwise fall back to Esri
const defaultSatelliteProvider = (
  process.env.NEXT_PUBLIC_SATELLITE_PROVIDER ??
  process.env.NEXT_PUBLIC_DEFAULT_SATELLITE_PROVIDER ??
  (eosdaPublicKey ? "eosda" : "esri")
).toLowerCase();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_EOSDA_TILE_API_KEY: eosdaPublicKey,
    NEXT_PUBLIC_EOSDA_CONFIGURED: isEosdaConfigured ? "true" : "false",
    NEXT_PUBLIC_DEFAULT_SATELLITE_PROVIDER: defaultSatelliteProvider,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:; style-src 'self' 'unsafe-inline' data: blob:; img-src 'self' data: blob: https:; font-src 'self' data: blob:; connect-src 'self' https: ws: wss:; media-src 'self' data: blob: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/satellite',
        destination: '/dashboard/satellite',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
