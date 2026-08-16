import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para Server Actions funcionarem atrás do proxy de preview (Codespaces/devcontainer)
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.app.github.dev", "*.githubpreview.dev"],
    },
  },
};

export default nextConfig;
