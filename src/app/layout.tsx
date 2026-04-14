import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Layra — Création visuelle IA",
  description:
    "Créez des visuels et vidéos professionnels alimentés par l'IA, sans compétences en design.",
  keywords: ["design IA", "création visuelle", "no-code", "posts Instagram", "canva IA"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased dark`} suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600;700;900&family=Poppins:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-gray-950 text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
