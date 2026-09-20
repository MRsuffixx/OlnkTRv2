/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["nodemailer", "ioredis", "pg", "@prisma/adapter-pg"],
  logging: {incomingRequests: {ignore: [/\/api\/auth\/callback\/email/,/\/api\/billing\/development/,/\/api\/account\/delete/]}},
  async headers() {
    return [{source:"/(.*)",headers:[
      {key:"Content-Security-Policy",value:`default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; media-src 'self' https:; frame-src https://open.spotify.com https://www.youtube.com https://player.twitch.tv; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==="development"?" 'unsafe-eval'":""}; style-src 'self' 'unsafe-inline'; connect-src 'self' wss://api.lanyard.rest`},
      {key:"X-Content-Type-Options",value:"nosniff"},{key:"X-Frame-Options",value:"DENY"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
    ]}];
  }
};

export default createNextIntlPlugin()(config);
