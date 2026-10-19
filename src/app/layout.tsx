import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { TrakteerWidget } from "@/components/trakteer-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: "TerraSiklus — Kalkulator Rotasi Tanaman & Kesehatan Tanah",
  description:
    "Rencanakan musim tanam berdasarkan famili botani, lacak riwayat petak, dan jaga kesehatan tanah. Dibuat untuk petani kecil dan pekebun rumah di Indonesia.",
  keywords: [
    "rotasi tanaman",
    "kesehatan tanah",
    "perencanaan kebun",
    "famili botani",
    "pertanian berkelanjutan",
  ],
};

export const viewport: Viewport = {
  themeColor: "#266335",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-bark-900 antialiased">
        <Providers>{children}</Providers>
        <TrakteerWidget />
      </body>
    </html>
  );
}
