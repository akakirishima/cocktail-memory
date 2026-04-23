import { Kiwi_Maru, M_PLUS_Rounded_1c } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const bodyFont = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});

const headingFont = Kiwi_Maru({
  weight: ["400", "500"],
  variable: "--font-heading",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "カクテル暗記アプリ",
  description: "選択式でカクテルの作り方を覚える学習アプリ。",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
