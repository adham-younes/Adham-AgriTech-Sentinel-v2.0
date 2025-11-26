import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AgriContextProvider } from "@/hooks/useAgriContext";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "منصة أدهم للزراعة الذكية",
  description:
    "تحليلات زراعية فورية مدعومة بالاستشعار عن بُعد وبيانات ESODA و Sentinel Hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased bg-background text-text`}>
        <AgriContextProvider>{children}</AgriContextProvider>
      </body>
    </html>
  );
}
