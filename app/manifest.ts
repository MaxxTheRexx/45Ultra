import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HEART CORE 45K · Trainingszentrale",
    short_name: "HEART CORE",
    description:
      "Trainingsplan, Check-ins, Prognose und Ernährung für den HEART CORE 45K Trail – auch offline.",
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
