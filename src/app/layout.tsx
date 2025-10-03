import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/providers/toast-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Personal Website & Portfolio",
    template: "%s | Portfolio",
  },
  description:
    "Full-Stack Engineer & Creative Technologist - Portfolio and Toolkit",
  metadataBase: new URL("https://example.com"), // TODO: replace with real domain
  openGraph: {
    title: "Personal Website & Portfolio",
    description:
      "Full-Stack Engineer & Creative Technologist - Portfolio and Toolkit",
    url: "https://example.com",
    siteName: "Personal Portfolio",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Website & Portfolio",
    description:
      "Full-Stack Engineer & Creative Technologist - Portfolio and Toolkit",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Prevent theme flash: pre-hydration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const ls = localStorage.getItem('theme'); const mql = window.matchMedia('(prefers-color-scheme: dark)'); const system = mql.matches ? 'dark' : 'light'; const theme = ls === 'light' || ls === 'dark' ? ls : system; if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); } catch(_) {} })();`,
          }}
        />
        {/* Site-wide Person JSON-LD (update with real data) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Your Name",
              url: "https://example.com",
              jobTitle: "Full-Stack Engineer",
              sameAs: ["https://github.com/romiafan"],
            }),
          }}
        />
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <MotionProvider>
                <ToastProvider>
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
                  >
                    Skip to main content
                  </a>
                  <div className="relative flex min-h-screen flex-col">
                    {/* Global background decorative layers */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                    >
                      {/* Soft radial gradients */}
                      <div className="absolute top-[-10%] left-[10%] h-[60vmax] w-[60vmax] rounded-full bg-gradient-to-br from-primary/25 via-transparent to-transparent blur-3xl opacity-40 dark:from-primary/15" />
                      <div className="absolute bottom-[-15%] right-[-5%] h-[55vmax] w-[55vmax] rounded-full bg-gradient-to-tr from-accent/25 via-transparent to-transparent blur-3xl opacity-35 dark:from-accent/15" />
                      {/* Noise overlay */}
                      <div className="absolute inset-0 mix-blend-overlay opacity-[0.07] dark:opacity-[0.10] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:6px_6px]" />
                    </div>
                    <Navbar />
                    <main id="main-content" className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                </ToastProvider>
              </MotionProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
