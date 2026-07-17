// Erzeugt die PWA-Icons aus einem SVG im App-Design (einmalig ausführen).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Stilisiertes Streckenprofil wie im App-Header, orange Fortschritts-Markierung.
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0F1411"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  <defs>
    <radialGradient id="glow" cx="50%" cy="-10%" r="80%">
      <stop offset="0%" stop-color="#1A241E"/>
      <stop offset="60%" stop-color="#0F1411" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="done"><rect x="0" y="0" width="300" height="512"/></clipPath>
  </defs>
  <g transform="translate(56,140)">
    <path d="M0,260 L24,208 L60,224 L108,140 L160,80 L200,110 L240,64 L272,96 L300,86 L332,40 L368,90 L400,120 L400,260 Z"
      fill="#1D2721" stroke="#3A4A40" stroke-width="6"/>
    <path d="M0,260 L24,208 L60,224 L108,140 L160,80 L200,110 L240,64 L272,96 L300,86 L332,40 L368,90 L400,120 L400,260 Z"
      fill="rgba(255,107,53,.30)" stroke="#FF6B35" stroke-width="8" clip-path="url(#done)"/>
    <line x1="244" y1="-20" x2="244" y2="280" stroke="#FF6B35" stroke-width="8" stroke-dasharray="16 14"/>
    <circle cx="244" cy="64" r="20" fill="#FF6B35"/>
  </g>
</svg>`;

const buf = Buffer.from(svg);
await mkdir("public", { recursive: true });
await sharp(buf).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(buf).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(buf).resize(180, 180).png().toFile("public/apple-icon.png");
await sharp(buf).resize(512, 512).png().toFile("app/icon.png");
console.log("Icons erzeugt: public/icon-512.png, icon-192.png, apple-icon.png, app/icon.png");
