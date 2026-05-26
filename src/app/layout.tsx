import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Real-Time Industrial Anomaly Monitor",
  description:
    "Production-style SECOM semiconductor anomaly monitoring dashboard with simulated IoT streaming and autoencoder inference.",
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
      <body className="min-h-full overflow-hidden bg-bg-page">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
