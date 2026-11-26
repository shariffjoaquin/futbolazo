import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Futbolazo",
  description: "Juego para adivinar jugadores de la Liga 1 peruana",
};

export const viewport: Viewport = {
  themeColor: "#022c22",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-emerald-950 text-white">{children}</body>
    </html>
  );
}
