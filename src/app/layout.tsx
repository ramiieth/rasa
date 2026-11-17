import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "رَسا (Rasa) | پلتفرم یکپارچه فروش، انبار و حسابداری",
  description:
    "ساخت فروشگاه اینترنتی متصل به صندوق فروش حضوری، کاردکس انبار، حسابداری دوبل و فید ترب",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.className}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
