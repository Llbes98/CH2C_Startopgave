import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CH2C Arkaden",
  description: "Tre klassiske arkadespil i ægte neonstil",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
