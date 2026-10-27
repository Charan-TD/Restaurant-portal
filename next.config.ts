import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  // Lets phones and other devices on the same Wi-Fi open the dev server by IP.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
};
export default config;
