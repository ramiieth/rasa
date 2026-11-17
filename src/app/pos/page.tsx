"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Barcode, CreditCard, Banknote, Printer, Trash2 } from "lucide-react";
import { formatToman } from "@/lib/format";

interface CartItem {
  variant_id: string;
  title: string;
  sku: string;
  unitPriceRials: number;
  qty: number;
}

export default function PosTerminalPage() {
  const router = useRouter();
  const [variants, setVariants] = useState<any[]>([]);
  const [tenantName, setTenantName] = useState("صندوق فروشگاهی رَسا");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"POS_CARD" | "CASH" | "CARD_TO_CARD">("POS_CARD");
  const [customerName, setCustomerName] = useState("مشتری حضوری");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ orderNumber: number; totalRials: number; items: CartItem[] } | null>(null);
  const [error, setError] = useState("");

  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/v1/admin/overview");
    if (res.status === 401) {
      router.push("/#provision");
      return;
    }
    const json = await res.json();
    setVariants(json.variants || []);
    if (json.tenant?.name) setTenantName(json.tenant.name);
  }, [router]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addToCart = useCallback((v: any) => {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === v.id);
      if (existing) {
        return prev.map((i) => (i.variant_id === v.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          variant_id: v.id,
          title: prod?.title || v.sku,
          sku: v.sku,
          unitPriceRials: Number(v.retail_price),
          qty: 1,
        },
      ];
    });
  }, []);

  // شنونده بارکدخوان سخت‌افزاری (HID Keyboard)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter" && barcodeBuffer.current.length >= 4) {
        const scanned = barcodeBuffer.current.trim();
        const found = variants.find(
          (v) => v.barcode === scanned || v.sku.toLowerCase() === scanned.toLowerCase()
        );
        if (found) {
          e.preventDefault();
          addToCart(found);
        }
        barcodeBuffer.current = "";
        return;
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [variants, addToCart]);

  const subtotalRials = cart.reduce((s, i) => s + i.unitPriceRials * i.qty, 0);
  const taxRials = Math.round(subtotalRials * 0.1);
  const totalRials = subtotalRials + taxRials;

  async function handleCheckout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "POS",
          paymentMethod,
          customerName,
          shippingCostToman: 0,
          idempotencyKey: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          items: cart.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "خطا در ثبت فاکتور");
        setSubmitting(false);
        return;
      }
      setReceipt({
        orderNumber: json.order.order_number,
        totalRials: json.order.total_amount,
        items: [...cart],
      });
      setCart([]);
      await loadProducts();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = variants.filter((v) => {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      prod?.title?.toLowerCase().includes(q) ||
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-lg bg-slate-800 p-2 hover:bg-slate-700">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div>
            <div className="font-bold text-sm">{tenantName} — صندوق فروش حضوری (POS)</div>
            <div className="text-[11px] text-slate-400">
              آماده دریافت اسکن بارکدخوان سخت‌افزاری + کسر آنی کاردکس
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-slate-200">
            <Barcode className="h-5 w-5 text-indigo-600" />
            <input
              type="text"
              placeholder="جستجو با نام کالا، کد SKU یا اسکن بارکد..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm focus:outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((v) => {
              const prod = Array.isArray(v.products) ? v.products[0] : v.products;
              const stock = Array.isArray(v.stock_balances)
                ? v.stock_balances[0]
                : v.stock_balances;
              const qty = Number(stock?.physical_qty || 0);

              return (
                <button
                  key={v.id}
                  disabled={qty <= 0}
                  onClick={() => addToCart(v)}
                  className="text-right rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-indigo-500 disabled:opacity-50 transition cursor-pointer"
                >
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">{prod?.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">{v.sku}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-700">
                      {formatToman(v.retail_price)}
                    </span>
                    <span className="text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      موجود: {qty}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="font-bold text-sm border-b border-slate-100 pb-2">
              فاکتور جاری صندوق
            </div>
            <input
              type="text"
              placeholder="نام مشتری (اختیاری)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  کالایی انتخاب نشده است
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs"
                  >
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-slate-500">
                        {item.qty} × {formatToman(item.unitPriceRials)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setCart((prev) => prev.filter((i) => i.variant_id !== item.variant_id))
                      }
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod("POS_CARD")}
                className={`flex items-center justify-center gap-1 rounded-xl border py-2 cursor-pointer ${
                  paymentMethod === "POS_CARD"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                کارتخوان
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex items-center justify-center gap-1 rounded-xl border py-2 cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200"
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                نقدی
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD_TO_CARD")}
                className={`rounded-xl border py-2 cursor-pointer ${
                  paymentMethod === "CARD_TO_CARD"
                    ? "border-amber-600 bg-amber-50 text-amber-700"
                    : "border-slate-200"
                }`}
              >
                کارت‌به‌کارت
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>جمع اقلام:</span>
                <span>{formatToman(subtotalRials)}</span>
              </div>
              <div className="flex justify-between">
                <span>مالیات ارزش افزوده (۱۰٪):</span>
                <span>{formatToman(taxRials)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>مبلغ قابل پرداخت:</span>
                <span>{formatToman(totalRials)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
            )}

            <button
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "در حال ثبت..." : "ثبت نهایی فاکتور و کسر انبار"}
            </button>
          </div>
        </div>
      </main>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-3 text-xs">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <div className="font-extrabold text-base">{tenantName}</div>
              <div className="text-slate-500 mt-1">شماره فاکتور: #{receipt.orderNumber}</div>
            </div>
            <div className="space-y-1.5">
              {receipt.items.map((item) => (
                <div key={item.variant_id} className="flex justify-between">
                  <span>
                    {item.title} × {item.qty}
                  </span>
                  <span>{formatToman(item.unitPriceRials * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between font-extrabold text-sm">
              <span>جمع کل با مالیات:</span>
              <span>{formatToman(receipt.totalRials)}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 py-2.5 text-white font-bold cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                چاپ فیش
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
