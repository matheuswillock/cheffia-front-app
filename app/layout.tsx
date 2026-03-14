import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import localFont from "next/font/local";
import { ThemeModeProvider } from "@/components/theme/theme-mode-provider";
import { getThemeInitScript } from "@/components/theme/theme-mode";
import { Toaster } from "@/components/ui/sonner";

const clashDisplay = localFont({
  src: [
    {
      path: "../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Extralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-clash-display", // Certifique-se de que o nome da variável está correto
  display: "swap",
});

const inter = Inter_Tight({
  weight: ["100", "200", "300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const data = {
  title: "Cheffia",
  description:
    "A revolução do cardápio digital. Transforme a experiência gastronômica com Cheffia.",
  keywords:
    "Cheffia, Cardápio Digital, Cardápio Online, Cardápio Interativo, Cardápio Virtual, Cardápio Inteligente, Cardápio Personalizado, Cardápio para Restaurantes, Cardápio para Bares, Cardápio para Cafés",
  url: "https://www.cheffia.com",
  image: "/images/og-image.png",
  siteName: "Cheffia",
}

export const viewport: Viewport = {
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: true,
  width: "device-width",
  height: "device-height",
};

export const metadata: Metadata = {
  title: data.title,
  description: data.description,
  applicationName: "Cheffia - Cardápio Digital",
  keywords: [
    "Cheffia",
    "Cardápio Digital",
    "Cardápio",
    "Cardápio Online",
    "Cardápio Interativo",
    "Cardápio Virtual",
    "Cardápio Inteligente",
    "Cardápio Personalizado",
    "Cardápio para Restaurantes",
    "Cardápio para Bares",
    "Cardápio para Cafés",
  ],
  authors: [{ name: "Cheffia" }],
  creator: "Cheffia",
  publisher: "Cheffia",
  appleWebApp: {
    capable: true,
    title: "Cheffia",
    statusBarStyle: "black-translucent",
    startupImage: [
      // {
      //   url: "/images/startup-image-640x1136.png",
      //   media: "(device-width: 320px) and (device-height: 568px)",
      // },
      // {
      //   url: "/images/startup-image-750x1334.png",
      //   media: "(device-width: 375px) and (device-height: 667px)",
      // },
      // {
      //   url: "/images/startup-image-1125x2436.png",
      //   media: "(device-width: 375px) and (device-height: 812px)",
      // },
    ],
  },
  openGraph: {
    title: data.title,
    description: data.description,
    url: data.url,
    siteName: "Cheffia",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: data.title,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: data.title,
    description: data.description,
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="dark" suppressHydrationWarning>
      <head>
        <script
          id="theme-init-script"
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
        />
      </head>
      <body
        className={`
          ${clashDisplay.variable}
          ${inter.variable}
          bg-background-default
          text-foreground-default
          font-inter
          min-h-screen
          w-full
          subpixel-antialiased`}
      >
        <ThemeModeProvider>
          <Analytics />
          <Toaster />
          {children}
        </ThemeModeProvider>
      </body>
    </html>
  );
}

