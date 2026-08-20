import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CyAsset — Manajemen Sarana Prasarana",
  description: "Aplikasi manajemen sarana prasarana SMK Cyber Media.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("cyasset-theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
