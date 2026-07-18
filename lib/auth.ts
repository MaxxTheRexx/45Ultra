import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { db } from "./db";
import * as schema from "./db/schema";
import { baseURL as resolveBaseURL } from "./base-url";

const baseURL = resolveBaseURL();
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
      rpName: "Trailhead",
      origin: baseURL,
    }),
    nextCookies(), // muss letztes Plugin sein (setzt Cookies in Server Actions)
  ],
});
