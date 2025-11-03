import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CBT SMANSABA - Sistem Ujian Online",
  description: "Platform ujian berbasis komputer yang memudahkan pengelolaan soal, pelaksanaan ujian, dan monitoring hasil secara real-time untuk lembaga pendidikan.",
  keywords: ["CBT", "Ujian Online", "Computer Based Test", "SMANSABA", "Sistem Ujian", "E-Learning"],
  authors: [{ name: "CBT System Team" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "CBT SMANSABA - Sistem Ujian Online",
    description: "Platform ujian berbasis komputer modern untuk lembaga pendidikan",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" expand={false} />
      </body>
    </html>
  );
}
