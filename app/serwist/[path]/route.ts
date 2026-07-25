import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { createSerwistRoute } from "@serwist/turbopack";

// Git-Commit als Cache-Version: neuer Deploy → Service Worker aktualisiert sich.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ??
  crypto.randomUUID();

// Alle Fotos vorab cachen — Kern-UI jeder Ansicht, muss offline sofort da sein.
const imgEntries = (() => {
  try {
    return readdirSync("public/img")
      .filter((f) => f.endsWith(".webp"))
      .map((f) => ({
        url: `/img/${f}`,
        revision: createHash("md5").update(readFileSync(`public/img/${f}`)).digest("hex"),
      }));
  } catch {
    return [];
  }
})();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }, ...imgEntries],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
