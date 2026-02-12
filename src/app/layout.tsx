import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UnderTheLight | تحت الضوء",
  description: "منصة اجتماعية حيث يظهر المشاركون تحت الضوء ويجيبون على أسئلة مفاجئة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}