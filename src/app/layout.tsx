import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Club · Football Management",
  description: "Build your club, shape your squad and create a stadium worth remembering.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
