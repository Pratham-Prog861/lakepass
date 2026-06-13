import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { checkAndSyncUser } from "@/lib/auth-sync";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});



const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LakePass - Boat Rental Platform",
  description: "Marina Admin Dashboard & Consumer Booking Experience",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sync user with local database if authenticated
  await checkAndSyncUser();

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", ibmPlexSans.variable, playfairDisplayHeading.variable)}
      >
        <body className="min-h-full flex flex-col">
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}

