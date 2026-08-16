import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SULGLASS — Orçamentos",
    short_name: "SULGLASS",
    description: "Orçamentos de esquadrias de alumínio e vidro temperado",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
