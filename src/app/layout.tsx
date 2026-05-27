import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Desktop dashboard canvas — preserve layout on mobile browsers (no mobile reflow). */
export const viewport: Viewport = {
  width: 1366,
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Real-Time Industrial Anomaly Monitor",
  description:
    "Production-style SECOM semiconductor anomaly monitoring dashboard with simulated IoT streaming and autoencoder inference.",
  openGraph: {
    title: "Real-Time Industrial Anomaly Monitor",
    description:
      "SECOM replay · live anomaly scoring · FastAPI autoencoder on Hugging Face.",
    images: ["/brand/og.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real-Time Industrial Anomaly Monitor",
    images: ["/brand/og.svg"],
  },
};

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme') || 'dark';
    var root = document.documentElement;
    root.setAttribute('data-theme', t);
    root.classList.toggle('dark', t !== 'light');
  } catch (e) {
    var root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} dark h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full overflow-x-auto overflow-y-hidden bg-bg-page">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
