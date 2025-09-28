import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ClerkProvider } from '@clerk/nextjs';
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
    template: "%s | Portfolio"
  },
  description: "Full-Stack Engineer & Creative Technologist - Portfolio and Toolkit",
  metadataBase: new URL("https://example.com"), // TODO: replace with real domain
  openGraph: {
    title: "Personal Website & Portfolio",
    description: "Full-Stack Engineer & Creative Technologist - Portfolio and Toolkit",
    url: "https://example.com",
    siteName: "Personal Portfolio",
    type: "website",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Website & Portfolio",
    description: "Full-Stack Engineer & Creative Technologist - Portfolio and Toolkit",
  },
  robots: {
    index: true,
    follow: true
  },
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {/* Prevent theme flash: pre-hydration script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const ls = localStorage.getItem('theme'); const mql = window.matchMedia('(prefers-color-scheme: dark)'); const system = mql.matches ? 'dark' : 'light'; const theme = ls === 'light' || ls === 'dark' ? ls : system; if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); } catch(_) {} })();`
          }}
        />
        {/* Site-wide Person JSON-LD (update with real data) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Your Name',
              url: 'https://example.com',
              jobTitle: 'Full-Stack Engineer',
              sameAs: [
                'https://github.com/romiafan'
              ]
            })
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
              <ToastProvider>
                <div className="relative flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </ToastProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
