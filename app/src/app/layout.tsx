import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Architects_Daughter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sketchFont = Architects_Daughter({
  variable: "--font-sketch",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SULGLASS — Orçamentos",
  description: "App de orçamentos de esquadrias de alumínio e vidro temperado",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SULGLASS",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${sketchFont.variable} h-full antialiased app-bg`}
    >
      <body className="h-full flex flex-col text-slate-900">{children}</body>
    </html>
  );
}


