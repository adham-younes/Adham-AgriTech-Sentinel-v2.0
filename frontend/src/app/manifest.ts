import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adham AgriTech",
    short_name: "Adham AgriTech",
    description: "Smart agriculture platform with AI agronomy, satellite analytics, and field intelligence.",
    start_url: "/",
    display: "standalone",
    background_color: "#020817",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/placeholder.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/placeholder.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  }
}

