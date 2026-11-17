"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ClipboardList,
  BookOpen,
  ShoppingBag,
  Store,
  PlusCircle,
  MonitorSmartphone,
  LogOut,
  ExternalLink,
  Rss,
} from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";

interface OverviewData {
  tenant: { id: string; slug: string; name: string; email: string };
  variants: any[];
  cardex: any[];
  orders: any[];
  journals: any[];
  pnl: {
    onlineSales: number;
    posSales: number;
    totalRevenue: number;
    totalCogs: number;
    grossProfit: number;
    totalTax: number;
    totalShipping: number;
    orderCount: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products" | "cardex" | "purchase" | "journals" | "orders">("products");
  const [msg, setMsg] = useState("");

  // Add product form
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryName, setCategoryName] = useState("پوشاک و کفش");
  const [retailPriceToman, setRetailPriceToman] = useState("");
  const [initialQty, setInitialQty] = useState("10");
  const [unitCostToman, setUnitCostToman] = useState("");

  // Purchase invoice form
  const [purVariantId, setPurVariantId] = useState("");
  const [purQty, setPurQty] = useState("5");
  const [purCostToman, setPurCostToman] = useState("");
  const [purNote, setPurNote] = useState("فاکتور خرید از تامین‌کننده");

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/v1/admin/overview");
    if (res.status === 401) {
      router.push("/#provision");
      return;
    }
    const json = await res.json();
    setData(json);
    if (json.variants?.length > 0 && !purVariantId) {
      setPurVariantId(json.variants[0].id);
    }
    setLoading(false);
  }, [router, purVariantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/v1/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sku,
        barcode,
        categoryName,
        retailPriceToman: Number(retailPriceToman),
        initialQty: Number(initialQty),
        unitCostToman: Number(unitCostToman),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || "خطا در ثبت محصول");
      return;
    }
    setTitle("");
    setSku("");
    setBarcode("");
    setRetailPriceToman("");
    setUnitCostToman("");
    setMsg("محصول با موفقیت ثبت شد و موجودی اولیه در کاردکس نشست.");
    await loadData();
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/v1/admin/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: purVariantId,
        qty: Number(purQty),
        unitCostToman: Number(purCostToman),
        note: purNote,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || "خطا در ثبت خرید");
      return;
    }
    setPurCostToman("");
    setMsg("فاکتور خرید ثبت شد، میانگین موزون بروزرسانی و سند حسابداری صادر گردید.");
    await loadData();
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 text-sm">
        در حال بارگذاری پنل مدیریت رَسا...
      </div>
    );
  }

  const { tenant, variants, cardex, orders, journals, pnl } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
              رَ
            </div>
            <div>
              <h1 className="font-extrabold text-base">{tenant.name}</h1>
              <div className="text-xs text-slate-500">پنل مدیریت یکپارچه رَسا ({tenant.slug})</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
            <Link
              href="/pos"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-white hover:bg-emerald-700"
            >
              <MonitorSmartphone className="h-4 w-4" />
              صندوق فروش حضوری (POS)
            </Link>
            <Link
              href={`/s/${tenant.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-indigo-700 hover:bg-indigo-100"
            >
              <Store className="h-4 w-4" />
              مشاهده ویترین سایت
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/api/v1/feeds/${tenant.slug}/torob`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              <Rss className="h-4 w-4 text-rose-500" />
              فید ترب
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">فروش آنلاین سایت</div>
            <div className="text-lg font-extrabold text-indigo-700 mt-1">
              {formatToman(pnl.onlineSales)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">فروش حضوری صندوق (POS)</div>
            <div className="text-lg font-extrabold text-emerald-700 mt-1">
              {formatToman(pnl.posSales)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">بهای تمام‌شده کالای فروش‌رفته (COGS)</div>
            <div className="text-lg font-extrabold text-slate-800 mt-1">
              {formatToman(pnl.totalCogs)}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs text-emerald-700 font-semibold">سود ناخالص واقعی</div>
            <div className="text-lg font-extrabold text-emerald-800 mt-1">
              {formatToman(pnl.grossProfit)}
            </div>
          </div>
        </div>

        {msg && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs font-semibold text-indigo-800">
            {msg}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "products", label: "محصولات و موجودی", icon: Package },
            { id: "cardex", label: "کاردکس انبار", icon: ClipboardList },
            { id: "purchase", label: "ثبت فاکتور خرید", icon: PlusCircle },
            { id: "orders", label: "سفارش‌ها", icon: ShoppingBag },
            { id: "journals", label: "اسناد حسابداری دوبل", icon: BookOpen },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  tab === item.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "products" && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
                لیست کالاها و موجودی لحظه‌ای ({variants.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">نام کالا</th>
                      <th className="p-3">SKU / بارکد</th>
                      <th className="p-3">قیمت فروش</th>
                      <th className="p-3">میانگین خرید</th>
                      <th className="p-3">موجودی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map((v) => {
                      const prod = Array.isArray(v.products) ? v.products[0] : v.products;
                      const stock = Array.isArray(v.stock_balances)
                        ? v.stock_balances[0]
                        : v.stock_balances;
                      return (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold">{prod?.title}</td>
                          <td className="p-3 font-mono text-slate-500">{v.sku}</td>
                          <td className="p-3 font-bold text-indigo-700">
                            {formatToman(v.retail_price)}
                          </td>
                          <td className="p-3 text-slate-600">
                            {formatToman(stock?.avg_unit_cost || 0)}
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
                              {stock?.physical_qty ?? 0} عدد
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <form
              onSubmit={handleAddProduct}
              className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
            >
              <h3 className="font-bold text-sm">افزودن کالای جدید به انبار</h3>
              <input
                type="text"
                required
                placeholder="نام کالا (مثلاً: هودی مشکی نخ‌پنبه)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="SKU (HOOD-BLK-L)"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-left"
                />
                <input
                  type="text"
                  dir="ltr"
                  placeholder="بارکد"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-left"
                />
              </div>
              <input
                type="text"
                placeholder="دسته‌بندی"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  required
                  placeholder="قیمت فروش (تومان)"
                  value={retailPriceToman}
                  onChange={(e) => setRetailPriceToman(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="number"
                  required
                  placeholder="قیمت خرید (تومان)"
                  value={unitCostToman}
                  onChange={(e) => setUnitCostToman(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <input
                type="number"
                required
                placeholder="موجودی اولیه (تعداد)"
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                ثبت محصول و موجودی اولیه
              </button>
            </form>
          </div>
        )}

        {tab === "cardex" && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
              کاردکس گردش کالا (غیرقابل تغییر / Append-Only)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">کالا</th>
                    <th className="p-3">نوع حرکت</th>
                    <th className="p-3">تغییر تعداد</th>
                    <th className="p-3">فی بهای تمام‌شده</th>
                    <th className="p-3">مانده پس از سند</th>
                    <th className="p-3">شرح</th>
                    <th className="p-3">زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cardex.map((row) => {
                    const v = Array.isArray(row.product_variants)
                      ? row.product_variants[0]
                      : row.product_variants;
                    const p = Array.isArray(v?.products) ? v.products[0] : v?.products;
                    return (
                      <tr key={row.id}>
                        <td className="p-3 font-semibold">{p?.title || v?.sku}</td>
                        <td className="p-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono">
                            {row.movement_type}
                          </span>
                        </td>
                        <td
                          className={`p-3 font-bold ${
                            row.qty_delta > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {row.qty_delta > 0 ? `+${row.qty_delta}` : row.qty_delta}
                        </td>
                        <td className="p-3">{formatToman(row.unit_cost)}</td>
                        <td className="p-3 font-bold">{row.balance_after}</td>
                        <td className="p-3 text-slate-600">{row.note}</td>
                        <td className="p-3 text-slate-400">{formatFaDate(row.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "purchase" && (
          <form
            onSubmit={handlePurchase}
            className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <h3 className="font-bold text-sm">ثبت فاکتور خرید (ورود کالا + محاسبه میانگین موزون)</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">انتخاب کالا</label>
              <select
                value={purVariantId}
                onChange={(e) => setPurVariantId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              >
                {variants.map((v) => {
                  const p = Array.isArray(v.products) ? v.products[0] : v.products;
                  return (
                    <option key={v.id} value={v.id}>
                      {p?.title} ({v.sku})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">تعداد خرید</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={purQty}
                  onChange={(e) => setPurQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">قیمت واحد خرید (تومان)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={purCostToman}
                  onChange={(e) => setPurCostToman(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">توضیحات فاکتور</label>
              <input
                type="text"
                value={purNote}
                onChange={(e) => setPurNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
            >
              ثبت فاکتور خرید و صدور سند حسابداری
            </button>
          </form>
        )}

        {tab === "orders" && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
              سفارش‌های آنلاین و حضوری ({orders.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3">شماره سفارش</th>
                    <th className="p-3">کانال</th>
                    <th className="p-3">روش پرداخت</th>
                    <th className="p-3">مشتری</th>
                    <th className="p-3">جمع کل</th>
                    <th className="p-3">COGS</th>
                    <th className="p-3">تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="p-3 font-bold">#{o.order_number}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 font-semibold ${
                            o.channel === "ONLINE"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {o.channel === "ONLINE" ? "آنلاین" : "حضوری POS"}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{o.payment_method}</td>
                      <td className="p-3">{o.customer_name}</td>
                      <td className="p-3 font-bold">{formatToman(o.total_amount)}</td>
                      <td className="p-3 text-slate-500">{formatToman(o.total_cogs)}</td>
                      <td className="p-3 text-slate-400">{formatFaDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "journals" && (
          <div className="space-y-4">
            {journals.map((j) => (
              <div key={j.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 text-xs">
                  <span className="font-bold">
                    سند شماره #{j.entry_number} — {j.description}
                  </span>
                  <span className="text-slate-400">{j.entry_date}</span>
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-1">کد و نام حساب</th>
                      <th className="py-1">بدهکار</th>
                      <th className="py-1">بستانکار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(j.journal_lines || []).map((line: any, idx: number) => {
                      const acc = Array.isArray(line.chart_of_accounts)
                        ? line.chart_of_accounts[0]
                        : line.chart_of_accounts;
                      return (
                        <tr key={idx} className="border-t border-slate-50">
                          <td className="py-1.5">
                            <span className="font-mono text-slate-500 ml-2">{acc?.code}</span>
                            {acc?.name}
                          </td>
                          <td className="py-1.5 text-emerald-700 font-semibold">
                            {Number(line.debit) > 0 ? formatToman(line.debit) : "—"}
                          </td>
                          <td className="py-1.5 text-rose-700 font-semibold">
                            {Number(line.credit) > 0 ? formatToman(line.credit) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
