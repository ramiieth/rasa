"use client";

import { useState } from "react";
import { ShoppingCart, CheckCircle2, Trash2 } from "lucide-react";
import { formatToman } from "@/lib/format";

export default function StorefrontClient({
  tenant,
  variants,
}: {
  tenant: { id: string; slug: string; name: string };
  variants: any[];
}) {
  const [cart, setCart] = useState<Array<{ variant_id: string; title: string; price: number; qty: number }>>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneOrder, setDoneOrder] = useState<number | null>(null);
  const [error, setError] = useState("");

  function addToCart(v: any) {
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
          price: Number(v.retail_price),
          qty: 1,
        },
      ];
    });
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

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
          paymentMethod: "ONLINE_GATEWAY",
          customerName: customerName || "خریدار اینترنتی",
          customerMobile,
          shippingCostToman: 45000,
          items: cart.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "خطا در ثبت سفارش");
        setLoading(false);
        return;
      }
      setDoneOrder(json.order.order_number);
      setCart([]);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{tenant.name}</h1>
            <p className="text-xs text-slate-500">فروشگاه آنلاین قدرت‌گرفته از پلتفرم رَسا</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700">
            <ShoppingCart className="h-4 w-4" />
            سبد خرید: {cart.reduce((s, i) => s + i.qty, 0)} کالا
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
          {variants.map((v) => {
            const prod = Array.isArray(v.products) ? v.products[0] : v.products;
            const stock = Array.isArray(v.stock_balances)
              ? v.stock_balances[0]
              : v.stock_balances;
            const qty = Number(stock?.physical_qty || 0);

            return (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <img
                    src={
                      prod?.image_url ||
                      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"
                    }
                    alt={prod?.title}
                    className="h-44 w-full object-cover bg-slate-100"
                  />
                  <div className="p-4">
                    <div className="text-[11px] text-indigo-600 font-semibold">
                      {prod?.category_name}
                    </div>
                    <h2 className="font-bold text-sm mt-1">{prod?.title}</h2>
                    <div className="text-xs text-slate-400 mt-1">کد کالا: {v.sku}</div>
                  </div>
                </div>
                <div className="px-4 pb-4 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">
                    {formatToman(v.retail_price)}
                  </span>
                  <button
                    disabled={qty <= 0}
                    onClick={() => addToCart(v)}
                    className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300 cursor-pointer"
                  >
                    {qty > 0 ? "افزودن به سبد" : "ناموجود"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 h-fit space-y-4">
          <h3 className="font-bold text-sm border-b border-slate-100 pb-2">سبد خرید و تسویه تستی</h3>

          {doneOrder && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              سفارش #{doneOrder} با موفقیت ثبت شد، موجودی انبار کسر و سند حسابداری صادر گردید!
            </div>
          )}

          <div className="space-y-2">
            {cart.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">سبد خرید خالی است</div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between text-xs bg-slate-50 rounded-xl p-2.5"
                >
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-slate-500">
                      {item.qty} × {formatToman(item.price)}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setCart((prev) => prev.filter((i) => i.variant_id !== item.variant_id))
                    }
                    className="text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleTestCheckout} className="space-y-3 border-t border-slate-100 pt-3">
            <input
              type="text"
              required
              placeholder="نام و نام خانوادگی خریدار"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              type="tel"
              required
              dir="ltr"
              placeholder="09123456789"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-left"
            />
            <div className="text-xs flex justify-between font-bold">
              <span>جمع اقلام (به‌علاوه پست ۴۵ هزار تومان):</span>
              <span>{formatToman(subtotal)}</span>
            </div>
            {error && <div className="text-xs text-rose-600">{error}</div>}
            <button
              type="submit"
              disabled={cart.length === 0 || loading}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "در حال ثبت..." : "ثبت سفارش تستی (بدون درگاه)"}
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}
