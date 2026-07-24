import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { SyncProvider } from "@/lib/sync-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nxstudio | Product Studio",
  description:
    "Founder-mode product studio — move an idea through validation, prototype, tech stack, build, and launch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WorkspaceProvider>
          <SyncProvider>{children}</SyncProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
