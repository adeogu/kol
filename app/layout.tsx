import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { PwaRegister } from "@/components/shared/pwa-register";
import { RecoveryLinkRedirect } from "@/components/shared/recovery-link-redirect";

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
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://huntstay.ie"),
  icons: {
    icon: "/globe.svg",
    apple: "/file.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${fraunces.variable} antialiased`}>
        <RecoveryLinkRedirect />
        <PwaRegister />
        <OfflineBanner />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
