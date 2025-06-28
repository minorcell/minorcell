import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "mCell - 我为网络构建事物",
  description: "mCell的个人网站 - 全栈开发者",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-background text-text-secondary`}>
        {children}
      </body>
    </html>
  );
}
