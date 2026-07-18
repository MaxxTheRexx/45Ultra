import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trailhead · Trainingszentrale",
    short_name: "Trailhead",
    description:
      "Dein individueller Trail- und Ultra-Trainingsplan: Kalender, Check-ins, Prognose und Ernährung – auch offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F1411",
    theme_color: "#0F1411",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
