"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "~/trpc/react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="olnk-theme"
    >
      <TRPCReactProvider>
        {children}
        <Toaster closeButton position="bottom-right" />
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
