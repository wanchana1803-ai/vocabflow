import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppHeader } from "@/components/navigation/app-header";
import { MobileNav } from "@/components/navigation/mobile-nav";
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
  title: {
    default: "VocabFlow - English Vocabulary Flashcards",
    template: "%s | VocabFlow",
  },
  description:
    "Master English vocabulary every day with spaced repetition flashcards, UK & US pronunciations, and visual memory cues.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VocabFlow",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1512" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground font-sans antialiased flex flex-col`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring font-medium text-xs"
        >
          ข้ามไปยังเนื้อหาหลัก (Skip to content)
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppHeader />
            <main id="main-content" tabIndex={-1} className="flex-1 pb-20 md:pb-8 focus:outline-none">
              {children}
            </main>
            <footer className="border-t border-border/60 bg-muted/20 py-6 px-4 text-xs text-muted-foreground pb-24 md:pb-6">
              <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <p>
                  &copy; {new Date().getFullYear()} <strong className="text-foreground">VocabFlow</strong>. Spaced Repetition English Flashcards.
                </p>
                <div className="flex items-center gap-4">
                  <Link href="/privacy" className="hover:text-foreground underline underline-offset-4 transition-colors">
                    ประกาศความเป็นส่วนตัว (Privacy Notice)
                  </Link>
                  <span>&bull;</span>
                  <Link href="/settings" className="hover:text-foreground underline underline-offset-4 transition-colors">
                    การตั้งค่า (Settings)
                  </Link>
                </div>
              </div>
            </footer>
            <MobileNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
