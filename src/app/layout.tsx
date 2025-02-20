import "./globals.css";
import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";

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
    <html lang="en">
      <body
        className={`${inter.className} bg-Background h-full text-foreground subpixel-antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
