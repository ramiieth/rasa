"use client";

import {
  PlusCircle,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Circle,
  Wallet,
  MessageSquare,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { formatToman } from "@/lib/format";

function getPersianCalendarGrid() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).formatToParts(now);

  const monthName = parts.find((p) => p.type === "month")?.value || "";
  const yearStr = parts.find((p) => p.type === "year")?.value || "";
  const dayStr = parts.find((p) => p.type === "day")?.value || "۱";

  const days = Array.from({ length: 30 }, (_, i) =>
    (i + 1).toLocaleString("fa-IR")
  );
  return { monthName, yearStr, dayStr, days };
}

export function DashboardHome({
  tenant,
  pnl,
  variantsCount,
  onOpenF7,
  onNavigate,
}: {
  tenant: {
    name: string;
    shippingWalletBalance: number;
    smsBalance: number;
    senderAddress: string;
    bankCardNumber: string;
  };
  pnl: { totalRevenue: number; netProfit: number; orderCount: number };
  variantsCount: number;
  onOpenF7: () => void;
  onNavigate: (tab: string) => void;
}) {
  const cal = getPersianCalendarGrid();

  const checklist = [
    { label: "۱. آشنایی با کلید میانبر F7 و صندوق", done: true, tab: "orders" },
    {
      label: "۲. تکمیل آدرس و کد پستی فرستنده در تنظیمات",
      done: Boolean(tenant.senderAddress),
      tab: "settings",
    },
    {
      label: "۳. ثبت شماره کارت / درگاه در مدیریت پرداخت",
      done: Boolean(tenant.bankCardNumber),
      tab: "settings",
    },
    { label: "۴. افزودن محصولات و موجودی کاردکس", done: variantsCount > 0, tab: "products" },
    { label: "۵. صدور اولین بارکد پستی / ماهکس", done: pnl.orderCount > 0, tab: "post-batch" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Action Cards matching Video 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={onOpenF7}
          className="rounded-2xl border border-rose-200 bg-white p-5 flex flex-col items-center justify-center gap-3 hover:border-rose-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xs text-slate-800">
            افزودن فاکتور فروش (F7)
          </span>
        </button>

        <button
          onClick={() => onNavigate("orders")}
          className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xs text-slate-800">
            لیست فاکتورهای فروش
          </span>
        </button>

        <button
          onClick={() => onNavigate("purchase")}
          className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center gap-3 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <TrendingUp className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xs text-slate-800">
            ثبت فاکتور خرید کالا
          </span>
        </button>

        <button
          onClick={() => onNavigate("post-batch")}
          className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <Truck className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xs text-slate-800">
            صدور بارکد گروهی پست
          </span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* 5-step onboarding checklist */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
          <div className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
            مراحل تکمیل فروشگاه آنلاین شما
          </div>
          <div className="space-y-2">
            {checklist.map((step, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(step.tab)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs hover:bg-indigo-50/50 transition cursor-pointer"
              >
                <span className="flex items-center gap-2.5 font-bold text-slate-800">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  {step.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    step.done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {step.done ? "تکمیل‌شده" : "نیاز به اقدام"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Persian Calendar + Quick Wallets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-extrabold text-xs flex items-center gap-1.5 text-slate-800">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
                {cal.monthName} {cal.yearStr}
              </span>
              <span className="text-[11px] font-bold text-indigo-600">
                امروز: {cal.dayStr} {cal.monthName}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => (
                <div key={d} className="font-bold text-slate-400 py-1">
                  {d}
                </div>
              ))}
              {cal.days.map((d) => {
                const isToday = d === cal.dayStr;
                return (
                  <div
                    key={d}
                    className={`rounded-lg py-1 font-semibold ${
                      isToday
                        ? "bg-indigo-600 text-white font-extrabold shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <Wallet className="h-4 w-4 text-indigo-600" /> شارژ حساب اداره پست:
              </span>
              <span className="font-extrabold text-slate-900">
                {formatToman(tenant.shippingWalletBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <MessageSquare className="h-4 w-4 text-emerald-600" /> اعتبار پنل پیامک:
              </span>
              <span className="font-extrabold text-slate-900">
                {formatToman(tenant.smsBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500 font-semibold">سود خالص تا این لحظه:</span>
              <span className="font-extrabold text-emerald-700">
                {formatToman(pnl.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
