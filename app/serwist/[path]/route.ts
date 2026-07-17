import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

// Git-Commit als Cache-Version: neuer Deploy → Service Worker aktualisiert sich.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ??
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
