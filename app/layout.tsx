import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "../components/PwaRegister";
import PwaInstallBanner from "../components/PwaInstallBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://home-and-toys-tio-willy.vercel.app"),
  title: "Home & Toys Tío Willy | Catálogo Oficial",
  description: "Tienda y distribuidora mayorista y al detal de Juguetería, Hogar y Variedades. Calidad Premium garantizada.",
  applicationName: "Home & Toys Tío Willy",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tío Willy",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Home & Toys Tío Willy | Catálogo Oficial",
    description: "Tienda y distribuidora mayorista y al detal de Juguetería, Hogar y Variedades en Caracas.",
    url: "https://home-and-toys-tio-willy.vercel.app/",
    siteName: "Home & Toys Tío Willy",
    images: [
      {
        url: "/images/logo.jpg",
        width: 1024,
        height: 1024,
        alt: "Home & Toys Tío Willy Logo",
      },
    ],
    locale: "es_VE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaDeferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaDeferredPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
                console.log('[PWA] Prompt de instalación listo.');
              });
              window.addEventListener('appinstalled', function() {
                window.__pwaDeferredPrompt = null;
                console.log('[PWA] Aplicación instalada exitosamente.');
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <PwaRegister />
        <PwaInstallBanner />
        {children}
      </body>
    </html>
  );
}
