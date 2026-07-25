// Lädt kuratierte, lizenzfreie Unsplash-Fotos, optimiert sie zu WebP und legt
// sie in public/img ab. Einmalig ausführen: node scripts/fetch-images.mjs
// Fällt bei fehlgeschlagenem Download auf einen Marken-Farbverlauf zurück,
// damit nie ein Bild fehlt.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

// Unsplash License (frei nutzbar). Ein Foto pro Slug, plus Fallback-Farben.
const IMAGES = [
  { slug: "trail",       id: "1551632811-561732d1e306", grad: ["#3d5a3d", "#1f2d1f"] },
  { slug: "lauf",        id: "1476480862126-209bfaa8edc8", grad: ["#c66a3a", "#7a3d1f"] },
  { slug: "kraft",       id: "1534438327276-14e5300c3a48", grad: ["#4a4a52", "#22222a"] },
  { slug: "rad",         id: "1541625602330-2277a4c46182", grad: ["#3e7fa6", "#1f4055"] },
  { slug: "schwimmen",   id: "1530549387789-4c1017266635", grad: ["#3a8fa6", "#1f5566"] },
  { slug: "yoga",        id: "1544367567-0f2fcb009e0b", grad: ["#8a6fd0", "#4a3a75"] },
  { slug: "stretch",     id: "1517836357463-d25dfeac3438", grad: ["#9a7fc0", "#5a4a80"] },
  { slug: "ruhe",        id: "1470071459604-3b5ec3a7fe05", grad: ["#5a6a70", "#2f3a40"] },
  { slug: "event",       id: "1552674605-db6ffd4facb5", grad: ["#e0442a", "#8a2517"] },
  { slug: "hero-login",  id: "1454496522488-7a8e488e8606", grad: ["#ff5b2e", "#7a2d15"] },
  { slug: "hero-heute",  id: "1464822759023-fed622ff2c3b", grad: ["#ff7b4e", "#7a3d25"] },
  { slug: "hero-plan",   id: "1506905925346-21bda4d32df4", grad: ["#3d5a6a", "#1f2d35"] },
  { slug: "recap",       id: "1571008887538-b36bb32f4571", grad: ["#c66a3a", "#5a3020"] },
  { slug: "nutrition",   id: "1490645935967-10de6ba17061", grad: ["#5c8a42", "#2f4522"] },
];

const W = 1200, H = 800;

function gradientSvg([a, b]) {
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`,
  );
}

await mkdir("public/img", { recursive: true });
let realCount = 0, total = 0;

for (const { slug, id, grad } of IMAGES) {
  let input;
  try {
    const url = `https://images.unsplash.com/photo-${id}?w=${W}&h=${H}&fit=crop&q=80`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    input = Buffer.from(await res.arrayBuffer());
    realCount++;
  } catch (e) {
    console.warn(`  ⚠ ${slug}: Download fehlgeschlagen (${e.message}) → Farbverlauf`);
    input = gradientSvg(grad);
  }
  const out = await sharp(input).resize(W, H, { fit: "cover" }).webp({ quality: 68 }).toBuffer();
  await writeFile(`public/img/${slug}.webp`, out);
  total += out.length;
  console.log(`  ✓ ${slug}.webp  ${(out.length / 1024).toFixed(0)} KB`);
}

console.log(`\n${realCount}/${IMAGES.length} echte Fotos · Gesamt ${(total / 1024 / 1024).toFixed(2)} MB`);
