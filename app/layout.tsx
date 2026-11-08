import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIAJAR — Generator Soal, Kisi-kisi & Kartu Soal",
  description:
    "Aplikasi penyusunan soal, kisi-kisi, dan kartu soal madrasah dengan pengesahan kepala madrasah.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
