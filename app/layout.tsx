import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "HuntStay | Trusted Hunting Land Access in Ireland",
  description:
    "HuntStay connects hunters with verified landowners across Ireland. Book hunting access, manage trips, and earn safely.",
  applicationName: "HuntStay",
  metadataBase: new URL("https://huntstay.ie"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${fraunces.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
