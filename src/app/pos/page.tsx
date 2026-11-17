"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Barcode,
  CreditCard,
  Banknote,
  Printer,
  Trash2,
  Plus,
  Minus,
  Radio,
} from "lucide-react";
import { formatToman } from "@/lib/format";

interface CartItem {
  variant_id: string;
  title: string;
  sku: string;
  unitPriceRials: number;
  qty: number;
  maxQty: number;
}

export default function PosTerminalPage() {
  const router = useRouter();
  const [variants, setVariants] = useState<any[]>([]);
  const [tenantName, setTenantName] = useState("صندوق فروشگاهی رَسا");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"POS_CARD" | "CASH" | "CARD_TO_CARD">("POS_CARD");
  const [customerName, setCustomerName] = useState("مشتری حضوری");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{
    orderNumber: number;
    totalRials: number;
    items: CartItem[];
    method: string;
  } | null>(null);
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
    const stock = Array.isArray(v.stock_balances) ? v.stock_balances[0] : v.stock_balances;
    const maxQty = Number(stock?.physical_qty || 0);
    if (maxQty <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === v.id);
      if (existing) {
        if (existing.qty >= maxQty) return prev;
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
          maxQty,
        },
      ];
    });
  }, []);

  function updateQty(variantId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id !== variantId) return item;
          const next = item.qty + delta;
          if (next <= 0) return null;
          if (next > item.maxQty) return item;
          return { ...item, qty: next };
        })
        .filter(Boolean) as CartItem[]
    );
  }

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
        method: paymentMethod,
      });
      setCart([]);
      await loadProducts();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  }

  const categories = [
    "همه",
    ...Array.from(
      new Set(
        variants.map((v) => {
          const p = Array.isArray(v.products) ? v.products[0] : v.products;
          return p?.category_name || "عمومی";
        })
      )
    ),
  ];

  const filtered = variants.filter((v) => {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    const cat = prod?.category_name || "عمومی";
    if (selectedCategory !== "همه" && cat !== selectedCategory) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      prod?.title?.toLowerCase().includes(q) ||
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-xl bg-slate-800 p-2 hover:bg-slate-700 transition">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div>
            <div className="font-extrabold text-sm">{tenantName} — پایانه فروش حضوری (POS)</div>
            <div className="text-[11px] text-slate-400">
              کسر آنی انبار و ثبت خودکار سند حسابداری
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-400">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          اسکنر بارکد آماده است
        </div>
      </header>

      <main className="no-print mx-auto w-full max-w-7xl flex-1 p-4 grid lg:grid-cols-12 gap-4">
        {/* Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 border border-slate-200 shadow-2xs">
            <Barcode className="h-5 w-5 text-indigo-600 shrink-0" />
            <input
              type="text"
              placeholder="جستجو با نام کالا، SKU یا اسکن بارکد..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm focus:outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
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
                  className="text-right rounded-2xl border border-slate-200 bg-white p-3.5 hover:border-indigo-500 hover:shadow-sm disabled:opacity-45 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 line-clamp-2 leading-relaxed">
                      {prod?.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">{v.sku}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-extrabold text-indigo-700">
                      {formatToman(v.retail_price)}
                    </span>
                    <span
                      className={`text-[11px] rounded-full px-2 py-0.5 font-bold ${
                        qty > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {qty > 0 ? `${qty} عدد` : "ناموجود"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Register Panel */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-sm">فاکتور جاری صندوق</span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  پاک کردن سبد
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="نام مشتری (اختیاری)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none"
            />

            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {cart.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-10">
                  روی کالاها کلیک کنید یا بارکد را اسکن نمایید
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="text-slate-500 mt-0.5">
                        {formatToman(item.unitPriceRials * item.qty)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.variant_id, -1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-extrabold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.variant_id, 1)}
                        className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => updateQty(item.variant_id, -item.qty)}
                        className="h-7 w-7 rounded-lg text-rose-500 flex items-center justify-center hover:bg-rose-50 cursor-pointer mr-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentMethod("POS_CARD")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 cursor-pointer transition ${
                  paymentMethod === "POS_CARD"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                کارتخوان
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 cursor-pointer transition ${
                  paymentMethod === "CASH"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <Banknote className="h-4 w-4" />
                نقدی
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD_TO_CARD")}
                className={`rounded-xl border py-2.5 cursor-pointer transition ${
                  paymentMethod === "CARD_TO_CARD"
                    ? "border-amber-600 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                کارت‌به‌کارت
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>جمع اقلام:</span>
                <span>{formatToman(subtotalRials)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مالیات ارزش افزوده (۱۰٪):</span>
                <span>{formatToman(taxRials)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold pt-1.5 border-t border-slate-800">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-emerald-400">{formatToman(totalRials)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <button
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? "در حال ثبت..." : "ثبت نهایی فاکتور و کسر انبار"}
            </button>
          </div>
        </div>
      </main>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4 text-xs shadow-2xl">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <div className="font-extrabold text-base">{tenantName}</div>
              <div className="text-slate-500 mt-1">
                رسید فروش حضوری — شماره #{receipt.orderNumber}
              </div>
            </div>
            <div className="space-y-2">
              {receipt.items.map((item) => (
                <div key={item.variant_id} className="flex justify-between">
                  <span>
                    {item.title} × {item.qty}
                  </span>
                  <span className="font-bold">{formatToman(item.unitPriceRials * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between font-extrabold text-sm">
              <span>مبلغ کل (با مالیات):</span>
              <span>{formatToman(receipt.totalRials)}</span>
            </div>
            <div className="no-print flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-white font-bold cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                چاپ فیش
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold cursor-pointer"
              >
                فاکتور جدید
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
