import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
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
      className={geist.variable}
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
        <NextIntlClientProvider key={locale} locale={locale}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
