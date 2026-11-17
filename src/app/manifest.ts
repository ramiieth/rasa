import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "رَسا (Rasa OS) — پلتفرم یکپارچه فروش، انبار و حسابداری",
    short_name: "رَسا",
    description:
      "سیستم‌عامل تجارت یکپارچه شامل فروشگاه آنلاین، صندوق فروش حضوری (POS)، کاردکس انبار و حسابداری دوبل",
    start_url: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
