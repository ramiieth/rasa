import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "رَسا (Rasa OS) | پلتفرم یکپارچه فروش، انبار و حسابداری",
  description:
    "ساخت فروشگاه اینترنتی متصل به صندوق فروش حضوری، کاردکس انبار، حسابداری دوبل و فید ترب",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "رَسا",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.className}>
      <body className="min-h-screen antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
