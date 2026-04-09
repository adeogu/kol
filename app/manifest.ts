import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HuntStay",
    short_name: "HuntStay",
    description:
      "Trusted hunting land access in Ireland. Discover, book, and manage trips.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2efe4",
    theme_color: "#2c5f3d",
    icons: [
      {
        src: "/globe.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/file.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
