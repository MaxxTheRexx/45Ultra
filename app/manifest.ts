import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "endurance24",
    short_name: "endurance24",
    description:
      "start playing mindgames w/ yourself — dein individueller Trail- & Ultra-Trainingsplan mit Tagescoach, Wissenschaft und Ernährung, auch offline.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F5F2",
    theme_color: "#F4F5F2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
