import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

import Script from "next/script";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniRide - Turning student trips into sustainable rides",
  description:
    "Find and share rides with students from your university. Airport trips, grocery runs, and more - organized in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-91CJYDXVG8');
          `}
        </Script>
      </body>
    </html>
  );
}
