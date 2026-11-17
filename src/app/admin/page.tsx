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
  Search,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Truck,
  Printer,
  Wallet,
  RefreshCw,
  Landmark,
  Settings,
  RotateCcw,
} from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";
import {
  SHIPPING_METHODS,
  SHIPPING_STATUS_LABELS,
  ShippingStatus,
} from "@/lib/shipping-calculator";

interface OverviewData {
  tenant: {
    id: string;
    slug: string;
    name: string;
    email: string;
    shippingWalletBalance: number;
    senderPhone: string;
    senderPostalCode: string;
    senderAddress: string;
    bankCardNumber: string;
    enamadCode: string;
  };
  variants: any[];
  cardex: any[];
  orders: any[];
  journals: any[];
  cheques: any[];
  expenses: any[];
  pnl: {
    onlineSales: number;
    posSales: number;
    totalRevenue: number;
    totalCogs: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    orderCount: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "products" | "cardex" | "purchase" | "shipping" | "treasury" | "orders" | "journals" | "settings"
  >("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTorob, setCopiedTorob] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<any | null>(null);
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  const [topupAmountToman, setTopupAmountToman] = useState("500000");

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

  // Cheque & Expense forms
  const [chqDir, setChqDir] = useState<"INCOMING" | "OUTGOING">("INCOMING");
  const [chqNum, setChqNum] = useState("");
  const [chqSayadi, setChqSayadi] = useState("");
  const [chqParty, setChqParty] = useState("");
  const [chqAmountToman, setChqAmountToman] = useState("");
  const [chqDueDate, setChqDueDate] = useState("2026-12-01");

  const [expCat, setExpCat] = useState("اجاره و قبوض");
  const [expTitle, setExpTitle] = useState("");
  const [expAmountToman, setExpAmountToman] = useState("");
  const [expMethod, setExpMethod] = useState<"CASH" | "ONLINE_GATEWAY">("CASH");

  // Store settings
  const [senderPhone, setSenderPhone] = useState("");
  const [senderPostalCode, setSenderPostalCode] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [bankCardNumber, setBankCardNumber] = useState("");
  const [enamadCode, setEnamadCode] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/v1/admin/overview");
    if (res.status === 401) {
      router.push("/#provision");
      return;
    }
    const json: OverviewData = await res.json();
    setData(json);
    if (json.variants?.length > 0 && !purVariantId) {
      setPurVariantId(json.variants[0].id);
    }
    setSenderPhone(json.tenant?.senderPhone || "");
    setSenderPostalCode(json.tenant?.senderPostalCode || "");
    setSenderAddress(json.tenant?.senderAddress || "");
    setBankCardNumber(json.tenant?.bankCardNumber || "");
    setEnamadCode(json.tenant?.enamadCode || "");
    setLoading(false);
  }, [router, purVariantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
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
      setToast({ type: "err", text: json.error || "خطا در ثبت محصول" });
      return;
    }
    setTitle("");
    setSku("");
    setBarcode("");
    setRetailPriceToman("");
    setUnitCostToman("");
    setToast({ type: "ok", text: "محصول جدید ثبت شد و موجودی اولیه در کاردکس نشست." });
    await loadData();
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
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
      setToast({ type: "err", text: json.error || "خطا در ثبت خرید" });
      return;
    }
    setPurCostToman("");
    setToast({
      type: "ok",
      text: "فاکتور خرید ثبت شد؛ میانگین موزون انبار و سند حسابداری دوبل به‌روزرسانی شدند.",
    });
    await loadData();
  }

  async function handleWalletTopup(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOPUP_WALLET",
        amountToman: Number(topupAmountToman),
      }),
    });
    if (res.ok) {
      setToast({ type: "ok", text: "کیف پول پیشخوان پستی با موفقیت شارژ شد." });
      await loadData();
    }
  }

  async function handleIssueBarcode(order: any) {
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ISSUE_BARCODE",
        orderId: order.id,
        carrier: order.shipping_carrier || "PISHTAZ",
        orderNumber: order.order_number,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setToast({
        type: "ok",
        text: `بارکد ۲۰ رقمی پستی (${json.barcode}) برای سفارش #${order.order_number} صادر شد.`,
      });
      await loadData();
    }
  }

  async function handleShippingStatusChange(orderId: string, shippingStatus: string) {
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_SHIPPING_STATUS",
        orderId,
        shippingStatus,
      }),
    });
    if (res.ok) {
      setToast({ type: "ok", text: "وضعیت مرسوله پستی به‌روزرسانی شد." });
      await loadData();
    }
  }

  async function handleReturnOrder(order: any) {
    const res = await fetch("/api/v1/admin/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setToast({ type: "err", text: json.error || "خطا در مرجوعی سفارش" });
      return;
    }
    const bnplNote =
      order.payment_method === "BNPL"
        ? ` و برنامه اقساط در ${order.bnpl_provider || "درگاه اقساطی"} تعدیل شد.`
        : ".";
    setToast({
      type: "ok",
      text: `سفارش #${order.order_number} مرجوع شد؛ کالا به کاردکس بازگشت و سند معکوس حسابداری صادر گردید${bnplNote}`,
    });
    await loadData();
  }

  async function handleAddCheque(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_CHEQUE",
        direction: chqDir,
        chequeNumber: chqNum,
        sayadiId: chqSayadi,
        partyName: chqParty,
        amountToman: Number(chqAmountToman),
        dueDate: chqDueDate,
      }),
    });
    if (res.ok) {
      setChqNum("");
      setChqSayadi("");
      setChqParty("");
      setChqAmountToman("");
      setToast({ type: "ok", text: "چک صیادی در خزانه‌داری ثبت شد." });
      await loadData();
    }
  }

  async function handleChequeStatus(chequeId: string, status: string) {
    const res = await fetch("/api/v1/admin/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_CHEQUE_STATUS", chequeId, status }),
    });
    if (res.ok) await loadData();
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_EXPENSE",
        category: expCat,
        title: expTitle,
        amountToman: Number(expAmountToman),
        paymentMethod: expMethod,
      }),
    });
    if (res.ok) {
      setExpTitle("");
      setExpAmountToman("");
      setToast({
        type: "ok",
        text: "هزینه ثبت شد و در سود خالص و سند حسابداری دوبل اعمال گردید.",
      });
      await loadData();
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_SETTINGS",
        senderPhone,
        senderPostalCode,
        senderAddress,
        bankCardNumber,
        enamadCode,
      }),
    });
    if (res.ok) {
      setToast({ type: "ok", text: "تنظیمات فرستنده و فروشگاه با موفقیت ذخیره شد." });
      await loadData();
    }
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
  }

  function copyTorobUrl(slug: string) {
    const url = `${window.location.origin}/api/v1/feeds/${slug}/torob`;
    navigator.clipboard.writeText(url);
    setCopiedTorob(true);
    setTimeout(() => setCopiedTorob(false), 2000);
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-semibold">
        در حال بارگذاری پنل مدیریت رَسا...
      </div>
    );
  }

  const { tenant, variants, cardex, orders, journals, cheques, expenses, pnl } = data;
  const marginPercent =
    pnl.totalRevenue > 0 ? Math.round((pnl.netProfit / pnl.totalRevenue) * 100) : 0;

  const filteredVariants = variants.filter((v) => {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      prod?.title?.toLowerCase().includes(q) ||
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q)
    );
  });

  const navItems = [
    { id: "products", label: "محصولات و موجودی", icon: Package },
    { id: "cardex", label: "کاردکس انبار", icon: ClipboardList },
    { id: "purchase", label: "ثبت فاکتور خرید", icon: PlusCircle },
    { id: "shipping", label: "پیشخوان پستی و ماهکس", icon: Truck },
    { id: "orders", label: "سفارش‌ها و مرجوعی", icon: ShoppingBag },
    { id: "treasury", label: "خزانه‌داری، چک و هزینه", icon: Landmark },
    { id: "journals", label: "اسناد حسابداری دوبل", icon: BookOpen },
    { id: "settings", label: "تنظیمات فروشگاه", icon: Settings },
  ];

  const onlineOrders = orders.filter((o) => o.channel === "ONLINE");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="no-print lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-l border-slate-200 bg-white flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold">
              رَ
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm text-slate-900 truncate">{tenant.name}</h1>
              <div className="text-[11px] text-slate-500 font-mono truncate">{tenant.slug}</div>
            </div>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as any)}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/pos"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            <MonitorSmartphone className="h-4 w-4" />
            ورود به صندوق فروش (POS)
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="no-print border-b border-slate-200 bg-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-extrabold text-slate-800">
            {navItems.find((i) => i.id === tab)?.label}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <Link
              href="/pos"
              className="lg:hidden flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-white"
            >
              <MonitorSmartphone className="h-4 w-4" />
              صندوق POS
            </Link>
            <Link
              href={`/s/${tenant.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Store className="h-4 w-4" />
              ویترین فروشگاه
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => copyTorobUrl(tenant.slug)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Rss className="h-4 w-4 text-rose-500" />
              {copiedTorob ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> کپی شد
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  لینک فید ترب <Copy className="h-3 w-3 text-slate-400" />
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="no-print p-4 sm:p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">فروش آنلاین + POS</div>
              <div className="text-lg sm:text-xl font-extrabold text-indigo-700 mt-1.5">
                {formatToman(pnl.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                آنلاین: {formatToman(pnl.onlineSales)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">بهای تمام‌شده (COGS)</div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-800 mt-1.5">
                {formatToman(pnl.totalCogs)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">میانگین موزون انبار</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">هزینه‌های جاری ثبت‌شده</div>
              <div className="text-lg sm:text-xl font-extrabold text-rose-700 mt-1.5">
                {formatToman(pnl.totalExpenses)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">اجاره، حقوق، بسته‌بندی</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-bold">سود خالص واقعی</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> {marginPercent}٪
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-800 mt-1.5">
                {formatToman(pnl.netProfit)}
              </div>
              <div className="text-[11px] text-emerald-700/70 mt-1">
                تعداد کل سفارش: {pnl.orderCount}
              </div>
            </div>
          </div>

          {toast && (
            <div
              className={`rounded-2xl border px-4 py-3 text-xs font-bold flex items-center gap-2 ${
                toast.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {toast.type === "ok" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              {toast.text}
            </div>
          )}

          {tab === "products" && (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-bold text-sm">
                    کاتالوگ کالا و موجودی ({filteredVariants.length})
                  </span>
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="جستجو نام، SKU یا بارکد..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-1.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3.5">نام کالا</th>
                        <th className="p-3.5">SKU</th>
                        <th className="p-3.5">قیمت فروش</th>
                        <th className="p-3.5">میانگین خرید</th>
                        <th className="p-3.5">موجودی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVariants.map((v) => {
                        const prod = Array.isArray(v.products) ? v.products[0] : v.products;
                        const stock = Array.isArray(v.stock_balances)
                          ? v.stock_balances[0]
                          : v.stock_balances;
                        const qty = Number(stock?.physical_qty ?? 0);
                        return (
                          <tr key={v.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5 font-bold text-slate-900">{prod?.title}</td>
                            <td className="p-3.5 font-mono text-slate-500">{v.sku}</td>
                            <td className="p-3.5 font-bold text-indigo-700">
                              {formatToman(v.retail_price)}
                            </td>
                            <td className="p-3.5 text-slate-600">
                              {formatToman(stock?.avg_unit_cost || 0)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`rounded-full px-2.5 py-1 font-bold ${
                                  qty === 0
                                    ? "bg-rose-50 text-rose-700"
                                    : qty <= 5
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {qty} عدد
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
                className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 h-fit shadow-2xs"
              >
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
                  افزودن کالای جدید به انبار
                </h3>
                <input
                  type="text"
                  required
                  placeholder="نام کالا (مثلاً: هودی مشکی نخ‌پنبه)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="SKU (HOOD-BLK)"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-left font-mono"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="بارکد"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-left font-mono"
                  />
                </div>
                <input
                  type="text"
                  placeholder="دسته‌بندی"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="قیمت فروش (تومان)"
                    value={retailPriceToman}
                    onChange={(e) => setRetailPriceToman(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                  />
                  <input
                    type="number"
                    required
                    placeholder="قیمت خرید (تومان)"
                    value={unitCostToman}
                    onChange={(e) => setUnitCostToman(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                  />
                </div>
                <input
                  type="number"
                  required
                  placeholder="موجودی اولیه (تعداد)"
                  value={initialQty}
                  onChange={(e) => setInitialQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  ثبت محصول و موجودی اولیه
                </button>
              </form>
            </div>
          )}

          {tab === "shipping" && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleWalletTopup}
                  className="lg:col-span-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 space-y-4 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-200 font-semibold flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-indigo-400" />
                      کیف پول پیشخوان پستی رَسا
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      متصل به پست و ماهکس
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold">
                    {formatToman(tenant.shippingWalletBalance)}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      min={50000}
                      value={topupAmountToman}
                      onChange={(e) => setTopupAmountToman(e.target.value)}
                      className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-xs text-white focus:outline-none"
                      placeholder="مبلغ شارژ (تومان)"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                    >
                      افزایش اعتبار
                    </button>
                  </div>
                </form>

                <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      حامل‌های پستی فعال (شامل ماهکس، پیشتاز، سفارشی، تیپاکس، چاپار)
                    </span>
                    <button
                      onClick={() => setBatchPrintOpen(true)}
                      disabled={onlineOrders.length === 0}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-40 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      چاپ گروهی لیبل‌ها ({onlineOrders.length})
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {SHIPPING_METHODS.map((m) => (
                      <div
                        key={m.code}
                        className="rounded-xl border border-slate-200 p-3 space-y-1 bg-slate-50/60"
                      >
                        <div className="font-bold text-xs text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.estDays}</div>
                        <div className="text-xs font-extrabold text-indigo-700 pt-1">
                          {m.isPostPaid ? "پس‌کرایه در مقصد" : `پایه: ${formatToman(m.baseRials)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
                  مدیریت مرسولات پستی، وضعیت مرحله‌به‌مرحله و بارکد ۲۰ رقمی
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3.5">سفارش</th>
                        <th className="p-3.5">گیرنده / موبایل</th>
                        <th className="p-3.5">سرویس</th>
                        <th className="p-3.5">مرحله ارسال</th>
                        <th className="p-3.5">بارکد رهگیری</th>
                        <th className="p-3.5">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-extrabold">#{o.order_number}</td>
                          <td className="p-3.5">
                            <div className="font-bold">{o.customer_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {o.customer_mobile || "—"}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700">
                              {o.shipping_carrier || "PISHTAZ"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={o.shipping_status || "PENDING_PACK"}
                              onChange={(e) => handleShippingStatusChange(o.id, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold"
                            >
                              {Object.entries(SHIPPING_STATUS_LABELS).map(([k, label]) => (
                                <option key={k} value={k}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700">
                            {o.tracking_barcode || "صادر نشده"}
                          </td>
                          <td className="p-3.5 flex items-center gap-2">
                            <button
                              onClick={() => handleIssueBarcode(o)}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <RefreshCw className="h-3 w-3" />
                              بارکد
                            </button>
                            <button
                              onClick={() => setSelectedLabelOrder(o)}
                              className="flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-600 cursor-pointer"
                            >
                              <Printer className="h-3 w-3" />
                              لیبل
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "treasury" && (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Cheques */}
              <div className="lg:col-span-7 space-y-4">
                <form
                  onSubmit={handleAddCheque}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs"
                >
                  <h3 className="font-extrabold text-sm">ثبت چک صیادی (وارده / صادره)</h3>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <select
                      value={chqDir}
                      onChange={(e) => setChqDir(e.target.value as any)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                    >
                      <option value="INCOMING">چک دریافتی از مشتری</option>
                      <option value="OUTGOING">چک پرداختی به تامین‌کننده</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="شماره چک"
                      value={chqNum}
                      onChange={(e) => setChqNum(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="شناسه صیادی ۱۶ رقمی"
                      value={chqSayadi}
                      onChange={(e) => setChqSayadi(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs text-left font-mono"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="نام طرف حساب"
                      value={chqParty}
                      onChange={(e) => setChqParty(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="number"
                      required
                      placeholder="مبلغ (تومان)"
                      value={chqAmountToman}
                      onChange={(e) => setChqAmountToman(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="date"
                      required
                      value={chqDueDate}
                      onChange={(e) => setChqDueDate(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    ثبت چک در خزانه‌داری
                  </button>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
                    لیست چک‌های ثبت‌شده ({cheques.length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="p-3">نوع</th>
                          <th className="p-3">طرف حساب / شماره</th>
                          <th className="p-3">مبلغ</th>
                          <th className="p-3">سررسید</th>
                          <th className="p-3">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cheques.map((c) => (
                          <tr key={c.id}>
                            <td className="p-3 font-bold">
                              {c.direction === "INCOMING" ? "وارده" : "صادره"}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold">{c.party_name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {c.cheque_number}
                              </div>
                            </td>
                            <td className="p-3 font-bold">{formatToman(c.amount)}</td>
                            <td className="p-3 font-mono">{c.due_date}</td>
                            <td className="p-3">
                              <select
                                value={c.status}
                                onChange={(e) => handleChequeStatus(c.id, e.target.value)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold bg-white"
                              >
                                <option value="PENDING">در جریان</option>
                                <option value="CLEARED">پاس‌شده</option>
                                <option value="BOUNCED">برگشتی</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="lg:col-span-5 space-y-4">
                <form
                  onSubmit={handleAddExpense}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs"
                >
                  <h3 className="font-extrabold text-sm">ثبت هزینه جاری فروشگاه</h3>
                  <select
                    value={expCat}
                    onChange={(e) => setExpCat(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                  >
                    <option value="اجاره و قبوض">اجاره و قبوض</option>
                    <option value="حقوق و دستمزد">حقوق و دستمزد</option>
                    <option value="بسته‌بندی و کارتن">بسته‌بندی و کارتن</option>
                    <option value="تبلیغات و ترب">تبلیغات و ترب</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="شرح هزینه (مثلاً: اجاره مغازه آبان‌ماه)"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      placeholder="مبلغ (تومان)"
                      value={expAmountToman}
                      onChange={(e) => setExpAmountToman(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                    />
                    <select
                      value={expMethod}
                      onChange={(e) => setExpMethod(e.target.value as any)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                    >
                      <option value="CASH">پرداخت از صندوق نقدی</option>
                      <option value="ONLINE_GATEWAY">پرداخت از حساب بانکی</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                  >
                    ثبت هزینه و کسر از سود خالص
                  </button>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-slate-700">
                    آخرین هزینه‌های ثبت‌شده ({expenses.length})
                  </div>
                  {expenses.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between text-xs border-t border-slate-100 pt-2"
                    >
                      <div>
                        <div className="font-bold">{ex.title}</div>
                        <div className="text-[11px] text-slate-400">{ex.category}</div>
                      </div>
                      <span className="font-extrabold text-rose-700">
                        {formatToman(ex.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
                سفارش‌های آنلاین، اقساطی BNPL، حضوری و عملیات مرجوعی ({orders.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3.5">سفارش</th>
                      <th className="p-3.5">کانال / پرداخت</th>
                      <th className="p-3.5">مشتری</th>
                      <th className="p-3.5">جمع کل</th>
                      <th className="p-3.5">وضعیت</th>
                      <th className="p-3.5">تاریخ</th>
                      <th className="p-3.5">مرجوعی کالا</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-extrabold">#{o.order_number}</td>
                        <td className="p-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-bold ${
                              o.channel === "ONLINE"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {o.channel === "ONLINE" ? "آنلاین" : "POS"}
                          </span>
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            {o.payment_method === "BNPL"
                              ? `BNPL (${o.bnpl_provider} - ${o.bnpl_installments} قسط)`
                              : o.payment_method}
                          </div>
                        </td>
                        <td className="p-3.5">{o.customer_name}</td>
                        <td className="p-3.5 font-extrabold text-slate-900">
                          {formatToman(o.total_amount)}
                        </td>
                        <td className="p-3.5">
                          {o.status === "RETURNED" ? (
                            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-bold text-rose-700">
                              مرجوع‌شده
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                              نهایی
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">{formatFaDate(o.created_at)}</td>
                        <td className="p-3.5">
                          <button
                            disabled={o.status === "RETURNED"}
                            onClick={() => handleReturnOrder(o)}
                            className="flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-35 cursor-pointer"
                          >
                            <RotateCcw className="h-3 w-3" />
                            ثبت مرجوعی
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "cardex" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="border-b border-slate-200 px-4 py-3 font-bold text-sm">
                کاردکس گردش کالا (Append-Only Ledger)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3.5">کالا</th>
                      <th className="p-3.5">نوع حرکت</th>
                      <th className="p-3.5">تغییر تعداد</th>
                      <th className="p-3.5">فی بهای تمام‌شده</th>
                      <th className="p-3.5">مانده نهایی</th>
                      <th className="p-3.5">شرح</th>
                      <th className="p-3.5">زمان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cardex.map((row) => {
                      const v = Array.isArray(row.product_variants)
                        ? row.product_variants[0]
                        : row.product_variants;
                      const p = Array.isArray(v?.products) ? v.products[0] : v?.products;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-bold">{p?.title || v?.sku}</td>
                          <td className="p-3.5">
                            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px]">
                              {row.movement_type}
                            </span>
                          </td>
                          <td
                            className={`p-3.5 font-extrabold ${
                              row.qty_delta > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {row.qty_delta > 0 ? `+${row.qty_delta}` : row.qty_delta}
                          </td>
                          <td className="p-3.5">{formatToman(row.unit_cost)}</td>
                          <td className="p-3.5 font-extrabold">{row.balance_after}</td>
                          <td className="p-3.5 text-slate-600">{row.note}</td>
                          <td className="p-3.5 text-slate-400">{formatFaDate(row.created_at)}</td>
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
              className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs"
            >
              <h3 className="font-extrabold text-sm border-b border-slate-100 pb-2.5">
                ثبت فاکتور خرید (ورود کالا + محاسبه میانگین موزون)
              </h3>
              <div>
                <label className="block text-xs font-bold mb-1.5">انتخاب کالا</label>
                <select
                  value={purVariantId}
                  onChange={(e) => setPurVariantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs bg-white"
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
                  <label className="block text-xs font-bold mb-1.5">تعداد خرید</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={purQty}
                    onChange={(e) => setPurQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">قیمت واحد خرید (تومان)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={purCostToman}
                    onChange={(e) => setPurCostToman(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">توضیحات فاکتور</label>
                <input
                  type="text"
                  value={purNote}
                  onChange={(e) => setPurNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                ثبت فاکتور خرید و صدور سند حسابداری
              </button>
            </form>
          )}

          {tab === "journals" && (
            <div className="space-y-4">
              {journals.map((j) => {
                const lines = j.journal_lines || [];
                const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
                const totalCredit = lines.reduce(
                  (s: number, l: any) => s + Number(l.credit || 0),
                  0
                );
                return (
                  <div
                    key={j.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3 text-xs">
                      <span className="font-extrabold text-slate-900">
                        سند شماره #{j.entry_number} — {j.description}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          تراز (بدهکار = بستانکار)
                        </span>
                        <span className="text-slate-400">{j.entry_date}</span>
                      </div>
                    </div>
                    <table className="w-full text-right text-xs">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="py-1.5">کد و نام حساب</th>
                          <th className="py-1.5">بدهکار</th>
                          <th className="py-1.5">بستانکار</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line: any, idx: number) => {
                          const acc = Array.isArray(line.chart_of_accounts)
                            ? line.chart_of_accounts[0]
                            : line.chart_of_accounts;
                          return (
                            <tr key={idx} className="border-t border-slate-50">
                              <td className="py-2">
                                <span className="font-mono text-slate-400 ml-2">{acc?.code}</span>
                                <span className="font-semibold text-slate-800">{acc?.name}</span>
                              </td>
                              <td className="py-2 text-emerald-700 font-bold">
                                {Number(line.debit) > 0 ? formatToman(line.debit) : "—"}
                              </td>
                              <td className="py-2 text-rose-700 font-bold">
                                {Number(line.credit) > 0 ? formatToman(line.credit) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 border-slate-200 font-extrabold text-slate-900">
                          <td className="py-2">جمع سند</td>
                          <td className="py-2">{formatToman(totalDebit)}</td>
                          <td className="py-2">{formatToman(totalCredit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "settings" && (
            <form
              onSubmit={handleSaveSettings}
              className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs"
            >
              <h3 className="font-extrabold text-sm border-b border-slate-100 pb-2.5">
                تنظیمات فرستنده روی لیبل پستی، کارت بانکی و اینماد
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">تلفن فرستنده</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="09110000000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">کد پستی فرستنده</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={senderPostalCode}
                    onChange={(e) => setSenderPostalCode(e.target.value)}
                    placeholder="4910000000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-left font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">آدرس کامل فرستنده (چاپ روی لیبل)</label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="استان، شهر، خیابان، پلاک"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">شماره کارت کارت‌به‌کارت</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={bankCardNumber}
                    onChange={(e) => setBankCardNumber(e.target.value)}
                    placeholder="6037-9975-0000-0000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">کد/لینک اینماد (eNamad)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={enamadCode}
                    onChange={(e) => setEnamadCode(e.target.value)}
                    placeholder="کد تایید اینماد"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-left"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                ذخیره تنظیمات فروشگاه
              </button>
            </form>
          )}
        </main>
      </div>

      {/* Single Printable Postal Label Modal */}
      {selectedLabelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 text-xs border-2 border-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <div className="font-extrabold text-base">برچسب استاندارد مرسوله پستی</div>
                <div className="text-slate-500">
                  سرویس: {selectedLabelOrder.shipping_carrier || "PISHTAZ"}
                </div>
              </div>
              <div className="text-left font-mono font-bold">
                #{selectedLabelOrder.order_number}
              </div>
            </div>

            <div className="rounded-xl border border-slate-300 p-3 text-center space-y-1 bg-slate-50">
              <div className="text-[10px] text-slate-500">بارکد ۲۰ رقمی مرسوله</div>
              <div className="font-mono font-extrabold text-sm tracking-widest">
                {selectedLabelOrder.tracking_barcode || "198450000000001001"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="text-slate-400">فرستنده:</div>
                <div className="font-bold">{tenant.name}</div>
                <div className="text-[11px] text-slate-500">{tenant.senderPhone}</div>
                <div className="text-[11px] text-slate-500">{tenant.senderAddress}</div>
              </div>
              <div>
                <div className="text-slate-400">وزن و کرایه حمل:</div>
                <div className="font-bold">
                  {selectedLabelOrder.total_weight_grams || 500} گرم —{" "}
                  {formatToman(selectedLabelOrder.shipping_cost)}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">گیرنده:</div>
              <div className="font-extrabold text-sm">{selectedLabelOrder.customer_name}</div>
              <div>تلفن: {selectedLabelOrder.customer_mobile || "—"}</div>
              <div>کد پستی: {selectedLabelOrder.receiver_postal_code || "—"}</div>
              <div>آدرس: {selectedLabelOrder.receiver_address || "ثبت در پرونده سفارش"}</div>
            </div>

            <div className="no-print flex gap-2 pt-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-white font-bold cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                چاپ لیبل پستی
              </button>
              <button
                onClick={() => setSelectedLabelOrder(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Printable Postal Labels Modal */}
      {batchPrintOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 space-y-4">
            <div className="no-print flex items-center justify-between border-b pb-3">
              <span className="font-extrabold text-sm">
                چاپ گروهی لیبل‌های پستی ({onlineOrders.length} مرسوله)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  چاپ همه لیبل‌ها
                </button>
                <button
                  onClick={() => setBatchPrintOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {onlineOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border-2 border-slate-800 p-4 text-xs space-y-2 break-inside-avoid"
                >
                  <div className="flex justify-between font-bold border-b pb-1.5">
                    <span>{o.shipping_carrier}</span>
                    <span>#{o.order_number}</span>
                  </div>
                  <div className="font-mono text-center bg-slate-100 py-1 rounded">
                    {o.tracking_barcode || "بدون بارکد"}
                  </div>
                  <div>
                    <strong>فرستنده:</strong> {tenant.name} ({tenant.senderPhone || "—"})
                  </div>
                  <div>
                    <strong>گیرنده:</strong> {o.customer_name} — {o.customer_mobile}
                  </div>
                  <div>
                    <strong>کد پستی:</strong> {o.receiver_postal_code || "—"}
                  </div>
                  <div className="text-[11px] text-slate-600">{o.receiver_address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
