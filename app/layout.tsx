import type { Metadata, Viewport } from "next";
import { Anton, Barlow } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

// "Startnummer"-Identität: Anton als Poster-Display, Barlow für alles andere.
const barlow = Barlow({
  variable: "--font-b",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-d",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trailhead · Trainingszentrale",
  description:
    "Dein individueller Trail- und Ultra-Trainingsplan: Kalender, Check-ins, Zielzeit-Prognose und Ernährung – auch offline.",
  applicationName: "Trailhead",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trailhead",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F4F0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${barlow.variable} ${anton.variable}`}
    >
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
      </body>
    </html>
  );
}
