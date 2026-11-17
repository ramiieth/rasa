"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PackageSearch, ArrowRight, CheckCircle2, Truck } from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";
import { SHIPPING_STATUS_LABELS, ShippingStatus } from "@/lib/shipping-calculator";

const STEPS: Array<{ key: ShippingStatus; label: string }> = [
  { key: "PENDING_PACK", label: "ثبت سفارش و آماده‌سازی در انبار" },
  { key: "HANDED_TO_CARRIER", label: "تحویل به مامور پست / ماهکس" },
  { key: "IN_TRANSIT", label: "در مسیر ارسال بین‌شهری" },
  { key: "DELIVERED", label: "تحویل‌شده به گیرنده" },
];

export default function OrderTrackingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ tenant: string; order: any } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(
        `/api/v1/orders/track?slug=${encodeURIComponent(slug)}&code=${encodeURIComponent(code)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "سفارش یافت نشد");
        setLoading(false);
        return;
      }
      setResult(json);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  const currentIdx = result
    ? Math.max(
        0,
        STEPS.findIndex((s) => s.key === (result.order.shipping_status || "PENDING_PACK"))
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href={`/s/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به فروشگاه
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900">
                پیگیری لحظه‌ای سفارش و مرسوله پستی
              </h1>
              <p className="text-xs text-slate-500">
                شماره سفارش (مثلاً 1001) یا بارکد ۲۰ رقمی پستی را وارد کنید
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              required
              dir="ltr"
              placeholder="1001 یا بارکد ۲۰ رقمی"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-left font-mono focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
            >
              {loading ? "جستجو..." : "رهگیری"}
            </button>
          </form>

          {error && (
            <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <div className="border-t border-slate-100 pt-4 space-y-4 text-xs">
              <div className="flex flex-wrap justify-between gap-2 bg-slate-50 rounded-2xl p-4">
                <div>
                  <div className="text-slate-400">سفارش #{result.order.order_number}</div>
                  <div className="font-extrabold text-sm mt-0.5">{result.order.customer_name}</div>
                </div>
                <div className="text-left">
                  <div className="font-bold text-indigo-700">
                    {formatToman(result.order.total_amount)}
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {formatFaDate(result.order.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 font-bold text-indigo-800">
                  <Truck className="h-4 w-4" />
                  سرویس: {result.order.shipping_carrier}
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {result.order.tracking_barcode || "در انتظار صدور بارکد"}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentIdx;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <CheckCircle2
                        className={`h-5 w-5 shrink-0 ${
                          done ? "text-emerald-600" : "text-slate-300"
                        }`}
                      />
                      <span
                        className={
                          done ? "font-bold text-slate-900" : "text-slate-400"
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                وضعیت فعلی:{" "}
                <strong>
                  {SHIPPING_STATUS_LABELS[
                    (result.order.shipping_status as ShippingStatus) || "PENDING_PACK"
                  ] || "در حال پردازش"}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
