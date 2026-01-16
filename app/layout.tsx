import { cookies } from "next/headers";
import type { Metadata } from "next";

import "./globals.css";

import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ActiveThemeProvider } from "@/components/active-theme";
import NextSessionProvider from '@/components/providers/session-provider'

export const metadata: Metadata = {
  title: "The CornerShop - Admin Dashboard",
  description:
    "The CornerShop Admin Dashboard for managing products, orders, vendors, and shops.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background overscroll-none font-sans antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : ""
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ActiveThemeProvider initialTheme={activeThemeValue}>
            {/* Session provider (wrap client components using useSession) */}
            {/* Use NEXT_PUBLIC_MOCK_ADMIN=true in .env to mock an ADMIN session during dev */}
            <NextSessionProvider>{children}</NextSessionProvider>
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
