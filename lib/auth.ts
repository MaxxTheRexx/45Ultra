import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { db } from "./db";
import * as schema from "./db/schema";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const { hostname } = new URL(baseURL);

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Offline-App: lange Sessions, damit man unterwegs nicht ausgeloggt wird.
    expiresIn: 60 * 60 * 24 * 60, // 60 Tage
    updateAge: 60 * 60 * 24, // täglich verlängern
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  plugins: [
    passkey({
      rpID: hostname,
      rpName: "HEART CORE 45K",
      origin: baseURL,
    }),
    nextCookies(), // muss letztes Plugin sein (setzt Cookies in Server Actions)
  ],
});
