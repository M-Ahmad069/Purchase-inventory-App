import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { BRAND } from "@/lib/brand";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: BRAND.name,
  description: `${BRAND.name} — ${BRAND.tagline}`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('hbs-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
