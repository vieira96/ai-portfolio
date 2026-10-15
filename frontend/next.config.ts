import type { NextConfig } from "next";

const backendImageHost = (() => {
  try {
    const url = new URL(process.env.BACKEND_URL ?? "http://localhost:8000");
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return { protocol: "http" as const, hostname: "localhost", port: "8000" };
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      backendImageHost,
    ],
    // O backend de dev roda em localhost (IP privado); sem isso o
    // otimizador recusa buscar os avatares servidos por ele.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
