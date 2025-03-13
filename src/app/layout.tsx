import "./globals.css";
import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter_Tight({
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cheffia",
  description: "Diga adeus aos erros nos pedidos!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${inter.className} bg-Background h-full min-w-full text-foreground subpixel-antialiased`}
      >
        <Analytics/>
        {children}
      </body>
    </html>
  );
}
