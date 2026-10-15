import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/shadcn/sonner";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Portfolio AI",
  description: "Intelligent portfolio with AI chat",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${dmMono.variable} dark h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-slate-100">
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
