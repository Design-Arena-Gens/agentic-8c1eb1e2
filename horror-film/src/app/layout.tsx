import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentic Midnight | Analog Horror Short",
  description:
    "A 60-second Hindi narrated analog horror experience with cinematic sound and subtitles.",
  metadataBase: new URL("https://agentic-8c1eb1e2.vercel.app"),
  openGraph: {
    title: "Agentic Midnight | Analog Horror Short",
    description:
      "Enter a minute-long analog horror descent: Hindi narration, chilling ambience, English subtitles.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic Midnight | Analog Horror Short",
    description:
      "A 60-second Hindi narrated analog horror experience with cinematic sound and subtitles.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
