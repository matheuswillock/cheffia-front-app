import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"
import localFont from "next/font/local";

const clashDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Extralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/clash-display/Fonts/WEB/fonts/ClashDisplay-Bold.woff2",
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
  variable: "--font-inter",
  display: "swap",
});

const data = {
  title: "Cheffia",
  description:
    "Seu Cardápio projetado para otimizar o fluxo do atendimento inicial até o pagamento.",
  url: "https://www.cheffia.com",
  image: "/images/og-image.png",
  siteName: "Cheffia",
}

export const viewport: Viewport = {
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
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
  appleWebApp: true,
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
    <html lang="pt-br">
      <body
        className={`
          ${clashDisplay.variable}
          ${inter.variable}
          bg-background-default
          text-foreground-default
          container
          font-clash
          min-h-screen
          w-full
          subpixel-antialiased`}
      >
        <Analytics />
        {children}
      </body>
    </html>
  );
}
