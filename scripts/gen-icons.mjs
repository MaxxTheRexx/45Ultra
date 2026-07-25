// Erzeugt die PWA-Icons im endurance24-Look (einmalig ausführen: node scripts/gen-icons.mjs).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Helle Fläche, orange Bergsilhouette + "24" — passend zur endurance24-Marke.
// Safe-Zone für maskable: Motiv innerhalb der mittleren ~80 %.
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#F4F5F2"/>
  <g>
    <path d="M96 336 L200 176 L268 268 L316 208 L416 336 Z" fill="#FF5B2E"/>
    <circle cx="316" cy="150" r="30" fill="#FF5B2E"/>
  </g>
  <text x="256" y="440" font-family="Manrope, Arial, sans-serif" font-size="120" font-weight="800"
    text-anchor="middle" fill="#171A16" letter-spacing="-4">24</text>
</svg>`;

const buf = Buffer.from(svg);
await mkdir("public", { recursive: true });
await sharp(buf).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(buf).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(buf).resize(180, 180).png().toFile("public/apple-icon.png");
await sharp(buf).resize(512, 512).png().toFile("app/icon.png");
await sharp(buf).resize(180, 180).png().toFile("app/apple-icon.png");
console.log("endurance24-Icons erzeugt: public/icon-512/192, apple-icon, app/icon.png");
