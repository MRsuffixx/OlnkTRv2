import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import {
  DM_Sans,
  Geist,
  Inter,
  JetBrains_Mono,
  Lora,
  Manrope,
  Playfair_Display,
  Space_Grotesk,
  Space_Mono,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { AppProviders } from "~/components/providers/app-providers";
export const metadata: Metadata = {
  title: {
    default: "OlnkTR",
    template: "%s · OlnkTR",
  },
  description: "Publish your links and content on one page.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1a20" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const fontVariables = [
  geist.variable,
  inter.variable,
  manrope.variable,
  dmSans.variable,
  spaceGrotesk.variable,
  lora.variable,
  playfairDisplay.variable,
  spaceMono.variable,
  jetBrainsMono.variable,
].join(" ");

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, common] = await Promise.all([
    getLocale(),
    getTranslations("common"),
  ]);

  return (
    <html
      lang={locale}
      className={fontVariables}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-sm bg-foreground px-3 py-2 text-sm font-medium text-background shadow-floating transition-transform focus:translate-y-0"
        >
          {common("skipToContent")}
        </a>
        <NextIntlClientProvider locale={locale}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
