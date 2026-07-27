import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import { SignInPrompt } from "@/components/signin-prompt";
import { GuestReactionSync } from "@/components/guest-reaction-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const LOGO = "https://whrdhub.org/wp-content/uploads/2025/05/imageedit_10_2063970092-600x198.png";

export const metadata: Metadata = {
  title: "WHRD Hub — a home for women human rights defenders",
  description:
    "The WHRD Hub connects women human rights defenders and their organisations across Kenya. Share updates, publish stories, find femtorship, and grow the movement.",
  icons: {
    icon: LOGO,
    shortcut: LOGO,
    apple: LOGO,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <AccessibilityWidget />
        <SignInPrompt />
        <GuestReactionSync />
      </body>
    </html>
  );
}
