import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

// endurance24-Identität: Manrope als Display/Zahlen, Inter für Fließtext.
const inter = Inter({
  variable: "--font-b",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-d",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "endurance24",
  description:
    "endurance24 — start playing mindgames w/ yourself. Dein individueller Trail- & Ultra-Trainingsplan mit Tagescoach, Wissenschaft und Ernährung – auch offline.",
  applicationName: "endurance24",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "endurance24",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F5F2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${manrope.variable}`}
    >
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
      </body>
    </html>
  );
}
