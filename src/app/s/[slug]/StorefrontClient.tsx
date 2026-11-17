"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Search,
  Plus,
  Minus,
  Truck,
  CreditCard,
  PackageSearch,
} from "lucide-react";
import { formatToman } from "@/lib/format";
import {
  SHIPPING_METHODS,
  ShippingCarrierCode,
  calculateShippingRials,
} from "@/lib/shipping-calculator";

export default function StorefrontClient({
  tenant,
  variants,
}: {
  tenant: { id: string; slug: string; name: string };
  variants: any[];
}) {
  const [cart, setCart] = useState<
    Array<{
      variant_id: string;
      title: string;
      price: number;
      weightGrams: number;
      qty: number;
      maxQty: number;
    }>
  >([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [shippingCarrier, setShippingCarrier] = useState<ShippingCarrierCode>("PISHTAZ");
  const [payMode, setPayMode] = useState<"ONLINE_GATEWAY" | "BNPL">("ONLINE_GATEWAY");
  const [bnplProvider, setBnplProvider] = useState<
    "SHOPINO" | "SNAPP_PAY" | "TOROB_PAY" | "DIGI_PAY"
  >("SHOPINO");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [receiverPostalCode, setReceiverPostalCode] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneOrder, setDoneOrder] = useState<{
    orderNumber: number;
    barcode?: string;
    isBnpl?: boolean;
    installmentRials?: number;
  } | null>(null);
  const [error, setError] = useState("");

  function addToCart(v: any) {
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
          price: Number(v.retail_price),
          weightGrams: Number(v.weight_grams || 500),
          qty: 1,
          maxQty,
        },
      ];
    });
  }

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
        .filter(Boolean) as typeof cart
    );
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalWeightGrams = cart.reduce((s, i) => s + i.weightGrams * i.qty, 0);
  const shippingRials = calculateShippingRials(shippingCarrier, totalWeightGrams, totalQty);
  const taxRials = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + shippingRials + taxRials;
  const perInstallmentRials = Math.round(grandTotal / 4);

  async function handleTestCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "ONLINE",
          tenantSlug: tenant.slug,
          paymentMethod: payMode,
          bnplProvider: payMode === "BNPL" ? bnplProvider : null,
          bnplInstallments: payMode === "BNPL" ? 4 : 1,
          customerName: customerName || "خریدار اینترنتی",
          customerMobile,
          shippingCarrier,
          receiverPostalCode,
          receiverAddress,
          shippingCostRials: shippingRials,
          items: cart.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "خطا در ثبت سفارش");
        setLoading(false);
        return;
      }
      setDoneOrder({
        orderNumber: json.order.order_number,
        barcode: json.order.tracking_barcode,
        isBnpl: payMode === "BNPL",
        installmentRials: perInstallmentRials,
      });
      setCart([]);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
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
    return prod?.title?.toLowerCase().includes(q) || v.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">{tenant.name}</h1>
            <p className="text-[11px] text-slate-500">
              فروشگاه آنلاین متصل به انبار، ماهکس، پست و درگاه اقساطی رَسا
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو در محصولات..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <Link
              href={`/s/${tenant.slug}/track`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
            >
              <PackageSearch className="h-4 w-4 text-indigo-600" />
              پیگیری مرسوله
            </Link>
            <div className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shrink-0">
              <ShoppingCart className="h-4 w-4" />
              <span>{totalQty}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((v) => {
              const prod = Array.isArray(v.products) ? v.products[0] : v.products;
              const stock = Array.isArray(v.stock_balances)
                ? v.stock_balances[0]
                : v.stock_balances;
              const qty = Number(stock?.physical_qty || 0);

              return (
                <div
                  key={v.id}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="relative overflow-hidden bg-slate-100">
                      <img
                        src={
                          prod?.image_url ||
                          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"
                        }
                        alt={prod?.title}
                        className="h-44 w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span
                        className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          qty > 0 ? "bg-white/90 text-emerald-700" : "bg-rose-600 text-white"
                        }`}
                      >
                        {qty > 0 ? `موجود (${qty})` : "ناموجود"}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="text-[11px] text-indigo-600 font-bold">
                        {prod?.category_name}
                      </div>
                      <h2 className="font-bold text-sm mt-1 text-slate-900 line-clamp-2">
                        {prod?.title}
                      </h2>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        {v.sku} • {v.weight_grams || 500} گرم
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {formatToman(v.retail_price)}
                    </span>
                    <button
                      disabled={qty <= 0}
                      onClick={() => addToCart(v)}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300 transition cursor-pointer"
                    >
                      {qty > 0 ? "افزودن" : "اتمام"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm sticky top-20">
            <h3 className="font-extrabold text-sm border-b border-slate-100 pb-3">
              سبد خرید، ارسال و پرداخت (نقدی / اقساطی BNPL)
            </h3>

            {doneOrder && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 space-y-1.5">
                <div className="flex items-center gap-2 font-extrabold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  سفارش #{doneOrder.orderNumber} ثبت و از انبار کسر شد!
                </div>
                {doneOrder.isBnpl && doneOrder.installmentRials && (
                  <div className="text-[11px] text-emerald-900">
                    طرح اقساطی ۴ ماهه فعال شد (هر قسط: {formatToman(doneOrder.installmentRials)})
                  </div>
                )}
                {doneOrder.barcode && (
                  <div className="rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-700 border border-emerald-200">
                    بارکد رهگیری: <strong>{doneOrder.barcode}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">سبد خرید خالی است</div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.variant_id}
                    className="flex items-center justify-between text-xs bg-slate-50 rounded-xl p-2.5 gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{item.title}</div>
                      <div className="text-slate-500 mt-0.5">
                        {formatToman(item.price * item.qty)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty(item.variant_id, -1)}
                        className="h-6 w-6 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.variant_id, 1)}
                        className="h-6 w-6 rounded-lg border border-slate-200 bg-white flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => updateQty(item.variant_id, -item.qty)}
                        className="text-rose-500 mr-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleTestCheckout} className="space-y-3 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  انتخاب سرویس پستی و لجستیک
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {SHIPPING_METHODS.map((m) => {
                    const active = shippingCarrier === m.code;
                    const rate = calculateShippingRials(m.code, totalWeightGrams, totalQty || 1);
                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => setShippingCarrier(m.code)}
                        className={`w-full text-right rounded-xl border px-3 py-2 text-xs transition cursor-pointer flex items-center justify-between ${
                          active
                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div>{m.title}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {m.estDays} — {m.subtitle}
                          </div>
                        </div>
                        <span className="font-bold text-indigo-700 shrink-0 mr-2">
                          {m.isPostPaid ? "پس‌کرایه" : formatToman(rate)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  شیوه پرداخت
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPayMode("ONLINE_GATEWAY")}
                    className={`rounded-xl border py-2 flex items-center justify-center gap-1 cursor-pointer ${
                      payMode === "ONLINE_GATEWAY"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    درگاه سامان کیش (سپ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode("BNPL")}
                    className={`rounded-xl border py-2 cursor-pointer ${
                      payMode === "BNPL"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    پرداخت اقساطی (۴ قسط)
                  </button>
                </div>

                {payMode === "BNPL" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 space-y-2">
                    <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                      {[
                        { id: "SHOPINO", label: "شاپینو" },
                        { id: "SNAPP_PAY", label: "اسنپ‌پی" },
                        { id: "TOROB_PAY", label: "ترب‌پی" },
                        { id: "DIGI_PAY", label: "دیجی‌پی" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setBnplProvider(p.id as any)}
                          className={`rounded-lg py-1.5 border cursor-pointer ${
                            bnplProvider === p.id
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold text-center">
                      پرداخت امروز (قسط اول): {formatToman(perInstallmentRials)} (۴ قسط بدون کارمزد)
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                required
                placeholder="نام و نام خانوادگی گیرنده"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-left"
                />
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="کد پستی ۱۰ رقمی"
                  value={receiverPostalCode}
                  onChange={(e) => setReceiverPostalCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-left font-mono"
                />
              </div>
              <input
                type="text"
                required
                placeholder="آدرس دقیق پستی گیرنده"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />

              <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>جمع اقلام ({totalWeightGrams} گرم):</span>
                  <span>{formatToman(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> هزینه ارسال:
                  </span>
                  <span>
                    {shippingCarrier === "COD" ? "پرداخت در مقصد" : formatToman(shippingRials)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>مالیات (۱۰٪):</span>
                  <span>{formatToman(taxRials)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>مبلغ نهایی:</span>
                  <span className="text-indigo-700">{formatToman(grandTotal)}</span>
                </div>
              </div>

              {error && <div className="text-xs font-bold text-rose-600">{error}</div>}

              <button
                type="submit"
                disabled={cart.length === 0 || loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
              >
                {loading
                  ? "در حال ثبت..."
                  : payMode === "BNPL"
                  ? "ثبت سفارش اقساطی ۴ ماهه و صدور بارکد"
                  : "ثبت سفارش و دریافت آنی بارکد پستی"}
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
}
