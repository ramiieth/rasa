"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  BookOpen,
  Truck,
  MessageSquare,
  Users,
  Landmark,
  Settings,
  ChevronDown,
  ChevronLeft,
  MonitorSmartphone,
  ExternalLink,
  LogOut,
  PlusCircle,
  Search,
  Printer,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Rss,
  Copy,
  Check,
  Wallet,
  Puzzle,
  FileEdit,
  Download,
  Video,
  Mail,
  Bike,
  Box,
} from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";
import { DashboardHome } from "@/components/admin/DashboardHome";
import { SalesInvoiceF7Modal } from "@/components/admin/SalesInvoiceF7Modal";
import {
  PostalLabelModal,
  OfficialInvoicePrintModal,
  PrintLabelMode,
} from "@/components/admin/PostalLabelModal";
import { RasaPostSection } from "@/components/admin/RasaPostSection";
import { RasaSmsSection } from "@/components/admin/RasaSmsSection";
import { ExtraAdminModules } from "@/components/admin/ExtraAdminModules";

interface OverviewData {
  tenant: {
    id: string;
    slug: string;
    name: string;
    email: string;
    shippingWalletBalance: number;
    smsBalance: number;
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
  customers: any[];
  smsTemplates: any[];
  smsLogs: any[];
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
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [openMenu, setOpenMenu] = useState<string>("accounting");
  const [f7Open, setF7Open] = useState(false);

  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedTorob, setCopiedTorob] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Orders filters matching Video 3 (سورنا ۵)
  const [orderChannelTab, setOrderChannelTab] = useState<"ONLINE" | "POS">("ONLINE");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [invoiceIdSearch, setInvoiceIdSearch] = useState("");
  const [txIdSearch, setTxIdSearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Print modals
  const [labelPrintState, setLabelPrintState] = useState<{
    orders: any[];
    mode: PrintLabelMode;
  } | null>(null);
  const [invoicePrintState, setInvoicePrintState] = useState<{
    order: any;
    mode: "THERMAL" | "A4";
  } | null>(null);

  // Forms
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryName, setCategoryName] = useState("پوشاک و کفش");
  const [retailPriceToman, setRetailPriceToman] = useState("");
  const [initialQty, setInitialQty] = useState("10");
  const [unitCostToman, setUnitCostToman] = useState("");

  const [purVariantId, setPurVariantId] = useState("");
  const [purQty, setPurQty] = useState("5");
  const [purCostToman, setPurCostToman] = useState("");
  const [purNote, setPurNote] = useState("فاکتور خرید از تامین‌کننده");

  const [retVariantId, setRetVariantId] = useState("");
  const [retQty, setRetQty] = useState("1");
  const [retNote, setRetNote] = useState("برگشت از خرید به تامین‌کننده");

  const [topupAmountToman, setTopupAmountToman] = useState("500000");

  // Cheques & Expenses
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

  // Settings
  const [senderPhone, setSenderPhone] = useState("");
  const [senderPostalCode, setSenderPostalCode] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [bankCardNumber, setBankCardNumber] = useState("");
  const [enamadCode, setEnamadCode] = useState("");

  // Customer form
  const [custName, setCustName] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [custAddress, setCustAddress] = useState("");

  const notify = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/v1/admin/overview");
    if (res.status === 401) {
      router.push("/#provision");
      return;
    }
    const json: OverviewData = await res.json();
    setData(json);
    if (json.variants?.length > 0) {
      if (!purVariantId) setPurVariantId(json.variants[0].id);
      if (!retVariantId) setRetVariantId(json.variants[0].id);
    }
    setSenderPhone(json.tenant?.senderPhone || "");
    setSenderPostalCode(json.tenant?.senderPostalCode || "");
    setSenderAddress(json.tenant?.senderAddress || "");
    setBankCardNumber(json.tenant?.bankCardNumber || "");
    setEnamadCode(json.tenant?.enamadCode || "");
    setLoading(false);
  }, [router, purVariantId, retVariantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F7") {
        e.preventDefault();
        setF7Open(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
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
    if (!res.ok) return notify("err", json.error || "خطا در ثبت محصول");
    setTitle("");
    setSku("");
    setBarcode("");
    setRetailPriceToman("");
    setUnitCostToman("");
    notify("ok", "محصول جدید ثبت شد و موجودی اولیه در کاردکس نشست.");
    await loadData();
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
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
    if (!res.ok) return notify("err", json.error || "خطا در ثبت خرید");
    setPurCostToman("");
    notify("ok", "فاکتور خرید ثبت شد؛ میانگین موزون و سند حسابداری دوبل بروزرسانی شد.");
    await loadData();
  }

  async function handlePurchaseReturn(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/purchase-return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: retVariantId,
        qty: Number(retQty),
        note: retNote,
      }),
    });
    const json = await res.json();
    if (!res.ok) return notify("err", json.error || "خطا در ثبت برگشت از خرید");
    notify("ok", "فاکتور برگشت از خرید در کاردکس و حسابداری دوبل ثبت شد.");
    await loadData();
  }

  async function handleToggleCheck(order: any) {
    await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_CHECK",
        orderId: order.id,
        isChecked: !order.is_checked,
      }),
    });
    await loadData();
  }

  async function handlePrintInvoice(order: any, mode: "THERMAL" | "A4") {
    await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "INCREMENT_PRINT", orderIds: [order.id] }),
    });
    setInvoicePrintState({ order, mode });
    await loadData();
  }

  async function handleBatchShippingStatus(status: string) {
    if (selectedOrderIds.length === 0) return;
    await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "BATCH_STATUS",
        orderIds: selectedOrderIds,
        shippingStatus: status,
      }),
    });
    notify("ok", `وضعیت ${selectedOrderIds.length} سفارش به‌روزرسانی شد.`);
    setSelectedOrderIds([]);
    await loadData();
  }

  async function handleReturnOrder(order: any) {
    const res = await fetch("/api/v1/admin/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const json = await res.json();
    if (!res.ok) return notify("err", json.error || "خطا در مرجوعی");
    notify("ok", `سفارش #${order.order_number} مرجوع شد و به کاردکس بازگشت.`);
    await loadData();
  }

  async function handleWalletTopup(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOPUP_WALLET", amountToman: Number(topupAmountToman) }),
    });
    if (res.ok) {
      notify("ok", "کیف پول پیشخوان پستی با موفقیت شارژ شد.");
      await loadData();
    }
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
      notify("ok", "چک صیادی ثبت شد.");
      await loadData();
    }
  }

  async function handleChequeStatus(chequeId: string, status: string) {
    await fetch("/api/v1/admin/treasury", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UPDATE_CHEQUE_STATUS", chequeId, status }),
    });
    await loadData();
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
      notify("ok", "هزینه ثبت شد و در سود خالص اعمال گردید.");
      await loadData();
    }
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: custName, mobile: custMobile, address: custAddress }),
    });
    if (res.ok) {
      setCustName("");
      setCustMobile("");
      setCustAddress("");
      notify("ok", "مشتری جدید ذخیره شد.");
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
      notify("ok", "تنظیمات فروشگاه و فرستنده ذخیره شد.");
      await loadData();
    }
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
  }

  function copyTorobUrl(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/api/v1/feeds/${slug}/torob`);
    setCopiedTorob(true);
    setTimeout(() => setCopiedTorob(false), 2000);
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm font-bold">
        در حال بارگذاری پنل مدیریت رَسا...
      </div>
    );
  }

  const {
    tenant,
    variants,
    cardex,
    orders,
    journals,
    cheques,
    expenses,
    customers,
    smsTemplates,
    smsLogs,
    pnl,
  } = data;

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

  const channelOrders = orders.filter((o) => {
    const matchChannel =
      orderChannelTab === "ONLINE"
        ? o.channel === "ONLINE" || o.channel === "MANUAL_PARCEL"
        : o.channel === "POS";
    if (!matchChannel) return false;
    if (orderStatusFilter === "SENT" && o.shipping_status === "PENDING_PACK") return false;
    if (orderStatusFilter === "PAID" && o.status === "RETURNED") return false;
    if (invoiceIdSearch && !String(o.order_number).includes(invoiceIdSearch.trim())) return false;
    if (txIdSearch && !String(o.tracking_barcode || "").includes(txIdSearch.trim())) return false;
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(o.order_number).includes(q) ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_mobile?.includes(q)
    );
  });

  function renderPaymentBadge(o: any) {
    if (o.payment_method === "BNPL") {
      if (o.bnpl_provider === "TOROB_PAY") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-0.5 text-[11px] font-bold text-white">
            ● ترب پی
          </span>
        );
      }
      if (o.bnpl_provider === "DIGI_PAY") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white">
            ● دیجی پی
          </span>
        );
      }
      if (o.bnpl_provider === "SHOPINO") {
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-white">
            ● شاپینو
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-white">
          ● اسنپ پی
        </span>
      );
    }
    if (o.channel === "POS") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[11px] font-bold text-slate-700">
          <span className="text-emerald-600">●</span> حضوری
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-[11px] font-bold text-slate-700">
        <span className="text-emerald-600">●</span> سامان کیش(سپ)
      </span>
    );
  }

  function renderCarrierBadge(o: any) {
    if (o.channel === "POS") return <span className="text-slate-400">—</span>;
    const carrier = o.shipping_carrier || "PISHTAZ";
    if (carrier === "COURIER") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
          <Bike className="h-3.5 w-3.5 text-emerald-600" /> پیک
        </span>
      );
    }
    if (carrier === "TIPAX" || carrier === "COD") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
          <Box className="h-3.5 w-3.5 text-amber-700" /> تیپاکس(پسکرایه)
        </span>
      );
    }
    if (carrier === "MAHEX") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
          <Box className="h-3.5 w-3.5 text-indigo-600" /> ماهکس
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
        <Mail className="h-3.5 w-3.5 text-slate-600" /> پست
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Dark Accordion Sidebar (matching Video 1, 2 & 3) */}
      <aside className="no-print lg:w-64 lg:shrink-0 bg-slate-900 text-slate-200 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold">
                رَ
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-white truncate">پنل مدیریت</div>
                <div className="text-[11px] text-slate-400 truncate">{tenant.name}</div>
              </div>
            </div>
          </div>

          <nav className="p-2.5 space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "dashboard" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> پیشخوان
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "products" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Package className="h-4 w-4" /> مدیریت محصولات
            </button>

            {/* Accounting Accordion */}
            <div>
              <button
                onClick={() => setOpenMenu(openMenu === "accounting" ? "" : "accounting")}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4" /> حسابداری
                </span>
                {openMenu === "accounting" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
              {openMenu === "accounting" && (
                <div className="pr-7 space-y-1 py-1 text-[11px] font-semibold text-slate-300">
                  <button
                    onClick={() => setActiveTab("purchase")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "purchase" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    فاکتور خرید
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "orders" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    فاکتور فروش
                  </button>
                  <button
                    onClick={() => setActiveTab("purchase-return")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "purchase-return"
                        ? "bg-slate-800 text-white"
                        : "hover:text-white"
                    }`}
                  >
                    فاکتور برگشت از خرید
                  </button>
                  <button
                    onClick={() => setActiveTab("cardex")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "cardex" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    کاردکس کالا
                  </button>
                  <button
                    onClick={() => setActiveTab("journals")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "journals" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    صورت سود و زیان / گزارشات
                  </button>
                </div>
              )}
            </div>

            {/* Rasa Post Accordion */}
            <div>
              <button
                onClick={() => setOpenMenu(openMenu === "post" ? "" : "post")}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4" /> رَسا پست (ماهکس و پست)
                </span>
                {openMenu === "post" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
              {openMenu === "post" && (
                <div className="pr-7 space-y-1 py-1 text-[11px] font-semibold text-slate-300">
                  <button
                    onClick={() => setActiveTab("post-batch")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "post-batch" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    صدور بارکد
                  </button>
                  <button
                    onClick={() => setActiveTab("post-manual")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "post-manual" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    صدور بارکد دستی
                  </button>
                  <button
                    onClick={() => setActiveTab("post-list")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "post-list" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    لیست بارکد
                  </button>
                  <button
                    onClick={() => setActiveTab("post-wallet")}
                    className={`block w-full text-right rounded-lg px-2.5 py-1.5 cursor-pointer ${
                      activeTab === "post-wallet" ? "bg-slate-800 text-white" : "hover:text-white"
                    }`}
                  >
                    شارژ حساب / کیف پول
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab("sms")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "sms" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="h-4 w-4" /> رَسا پیامک
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "customers" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Users className="h-4 w-4" /> اشخاص
            </button>

            <button
              onClick={() => setActiveTab("treasury")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "treasury" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Landmark className="h-4 w-4" /> مدیریت پرداخت
            </button>

            <button
              onClick={() => setActiveTab("blog")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "blog" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <FileEdit className="h-4 w-4" /> بلاگ
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "settings" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Settings className="h-4 w-4" /> تنظیمات
            </button>

            <button
              onClick={() => setActiveTab("plugins")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "plugins" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Puzzle className="h-4 w-4" /> افزونه‌ها و افزونه‌های من
            </button>

            <button
              onClick={() => setActiveTab("tutorials")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "tutorials" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Video className="h-4 w-4" /> ویدیو آموزش پنل
            </button>

            <button
              onClick={() => setActiveTab("drivers")}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition cursor-pointer ${
                activeTab === "drivers" ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
              }`}
            >
              <Download className="h-4 w-4" /> نرم‌افزار و درایورها
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 space-y-2 text-xs">
          <Link
            href={`/s/${tenant.slug}`}
            target="_blank"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2 font-bold text-white hover:bg-rose-600 transition"
          >
            مشاهده وبسایت
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/pos"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2 font-bold text-slate-200 hover:bg-slate-700"
          >
            <MonitorSmartphone className="h-4 w-4" /> پایانه فروشگاهی (POS)
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 py-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> خروج
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0">
        <header className="no-print border-b border-slate-200 bg-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href={`/s/${tenant.slug}`}
              target="_blank"
              className="rounded-lg bg-rose-500 px-3.5 py-1.5 font-bold text-white hover:bg-rose-600"
            >
              مشاهده وبسایت
            </Link>
            <span className="hidden md:inline text-slate-600 font-bold">
              همه مبالغ به تومان می‌باشد
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-slate-400 font-mono">
              نسخه پنل مدیریت: ۷۴۵.۰.۳
            </span>
            <button
              onClick={() => copyTorobUrl(tenant.slug)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Rss className="h-4 w-4 text-rose-500" />
              {copiedTorob ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> کپی شد
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  فید ترب <Copy className="h-3 w-3 text-slate-400" />
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="no-print p-4 sm:p-6 space-y-5">
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

          {activeTab === "dashboard" && (
            <DashboardHome
              tenant={tenant}
              pnl={pnl}
              variantsCount={variants.length}
              onOpenF7={() => setF7Open(true)}
              onNavigate={(t) => setActiveTab(t)}
            />
          )}

          {(activeTab === "post-batch" ||
            activeTab === "post-manual" ||
            activeTab === "post-list") && (
            <RasaPostSection
              subTab={activeTab as any}
              orders={orders}
              tenant={tenant}
              onReload={loadData}
              onNotify={notify}
              onOpenPrintModal={(ordersToPrint, mode) =>
                setLabelPrintState({ orders: ordersToPrint, mode })
              }
            />
          )}

          {activeTab === "post-wallet" && (
            <form
              onSubmit={handleWalletTopup}
              className="max-w-md rounded-2xl border border-indigo-200 bg-indigo-950 text-white p-6 space-y-4"
            >
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Wallet className="h-4 w-4" /> کیف پول پیشخوان رَسا پست
              </div>
              <div className="text-2xl font-extrabold">
                {formatToman(tenant.shippingWalletBalance)}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={topupAmountToman}
                  onChange={(e) => setTopupAmountToman(e.target.value)}
                  className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 cursor-pointer"
                >
                  افزایش اعتبار
                </button>
              </div>
            </form>
          )}

          {activeTab === "sms" && (
            <RasaSmsSection
              templates={smsTemplates}
              logs={smsLogs}
              smsBalance={tenant.smsBalance}
              onReload={loadData}
              onNotify={notify}
            />
          )}

          {(activeTab === "plugins" ||
            activeTab === "blog" ||
            activeTab === "drivers" ||
            activeTab === "tutorials") && (
            <ExtraAdminModules activeTab={activeTab as any} onNotify={notify} />
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Top Tabs: وبسایت vs حضوری / دایرکت (Exact layout from Video 3) */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex rounded-xl bg-white border border-slate-200 p-1 text-xs font-bold">
                  <button
                    onClick={() => setOrderChannelTab("ONLINE")}
                    className={`rounded-lg px-5 py-2 cursor-pointer transition ${
                      orderChannelTab === "ONLINE"
                        ? "bg-emerald-500 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    وبسایت
                  </button>
                  <button
                    onClick={() => setOrderChannelTab("POS")}
                    className={`rounded-lg px-5 py-2 cursor-pointer transition ${
                      orderChannelTab === "POS"
                        ? "bg-emerald-500 text-white"
                        : "text-slate-600"
                    }`}
                  >
                    حضوری / دایرکت
                  </button>
                </div>

                <button
                  onClick={() => setF7Open(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  افزودن فاکتور فروش
                </button>
              </div>

              {/* Filter Bar matching Video 3 */}
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-700"
                >
                  <option value="ALL">همه وضعیت‌ها (ارسال شده / پرداخت شده)</option>
                  <option value="SENT">● ارسال شده</option>
                  <option value="PAID">● پرداخت شده</option>
                </select>
                <input
                  type="text"
                  placeholder="جستجوی مشتری..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="# شناسه فاکتور"
                  value={invoiceIdSearch}
                  onChange={(e) => setInvoiceIdSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="شناسه تراکنش / بارکد"
                  value={txIdSearch}
                  onChange={(e) => setTxIdSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono"
                />
              </div>

              {/* Group Actions Row matching Video 3 */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => handleBatchShippingStatus("HANDED_TO_CARRIER")}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  تغییر وضعیت گروهی ({selectedOrderIds.length})
                </button>
                <button
                  onClick={() => {
                    const targets = channelOrders.filter((o) =>
                      selectedOrderIds.includes(o.id)
                    );
                    if (targets.length === 0) {
                      return notify("err", "ابتدا چند فاکتور را تیک بزنید.");
                    }
                    setLabelPrintState({ orders: targets, mode: "A6_WITH_ITEMS" });
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  انتخاب پرینت / چاپ آدرس گیرنده
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="p-3">ردیف</th>
                        <th className="p-3">تغییر وضعیت</th>
                        <th className="p-3">شماره فاکتور</th>
                        <th className="p-3">تاریخ</th>
                        <th className="p-3">مشتری</th>
                        <th className="p-3">تعداد کالا</th>
                        <th className="p-3">نوع پرداخت</th>
                        <th className="p-3">نحوه ارسال</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3">جمع کل</th>
                        <th className="p-3">تعداد پرینت</th>
                        <th className="p-3">فیش</th>
                        <th className="p-3">کنترل</th>
                        <th className="p-3">فاکتور / مرجوعی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {channelOrders.map((o, idx) => {
                        const checked = selectedOrderIds.includes(o.id);
                        const itemQtySum = (o.order_items || []).reduce(
                          (s: number, it: any) => s + Number(it.qty || 1),
                          0
                        ) || 1;

                        return (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedOrderIds((prev) =>
                                    checked ? prev.filter((id) => id !== o.id) : [...prev, o.id]
                                  )
                                }
                                className="h-4 w-4 accent-emerald-600"
                              />
                            </td>
                            <td className="p-3 font-extrabold font-mono">#{o.order_number}</td>
                            <td className="p-3 text-slate-500">{formatFaDate(o.created_at)}</td>
                            <td className="p-3 font-bold">{o.customer_name}</td>
                            <td className="p-3 font-bold text-center">{itemQtySum}</td>
                            <td className="p-3">{renderPaymentBadge(o)}</td>
                            <td className="p-3">{renderCarrierBadge(o)}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                                <span className="text-emerald-600">●</span>{" "}
                                {o.status === "RETURNED"
                                  ? "مرجوع شده"
                                  : o.shipping_status === "PENDING_PACK"
                                  ? "پرداخت شده"
                                  : "ارسال شده"}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold">{formatToman(o.total_amount)}</td>
                            <td className="p-3 text-center font-bold">{o.print_count || 0}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handlePrintInvoice(o, "THERMAL")}
                                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 cursor-pointer"
                                title="چاپ فیش حرارتی"
                              >
                                <Printer className="h-4 w-4 text-slate-700" />
                              </button>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleCheck(o)}
                                className={`h-6 w-6 rounded-full flex items-center justify-center cursor-pointer ${
                                  o.is_checked
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </td>
                            <td className="p-3 flex items-center gap-1.5">
                              <button
                                onClick={() => handlePrintInvoice(o, "A4")}
                                className="rounded-lg bg-slate-900 p-1.5 text-white hover:bg-indigo-600 cursor-pointer"
                                title="فاکتور رسمی A4"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                              <button
                                disabled={o.status === "RETURNED"}
                                onClick={() => handleReturnOrder(o)}
                                className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                                title="ثبت مرجوعی"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-sm">
                    محصولات و موجودی ({filteredVariants.length})
                  </span>
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute right-3 top-2" />
                    <input
                      type="text"
                      placeholder="جستجو نام، SKU یا بارکد..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-1.5 text-xs"
                    />
                  </div>
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
                      {filteredVariants.map((v) => {
                        const prod = Array.isArray(v.products) ? v.products[0] : v.products;
                        const stock = Array.isArray(v.stock_balances)
                          ? v.stock_balances[0]
                          : v.stock_balances;
                        const qty = Number(stock?.physical_qty ?? 0);
                        return (
                          <tr key={v.id}>
                            <td className="p-3 font-bold">{prod?.title}</td>
                            <td className="p-3 font-mono text-slate-500">
                              {v.sku} / {v.barcode}
                            </td>
                            <td className="p-3 font-bold text-indigo-700">
                              {formatToman(v.retail_price)}
                            </td>
                            <td className="p-3">{formatToman(stock?.avg_unit_cost || 0)}</td>
                            <td className="p-3 font-bold text-emerald-700">{qty} عدد</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <form
                onSubmit={handleAddProduct}
                className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 space-y-3 text-xs h-fit"
              >
                <h3 className="font-extrabold text-sm">افزودن کالای جدید</h3>
                <input
                  type="text"
                  required
                  placeholder="نام کالا"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="SKU"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-left"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="بارکد (مثلاً 1252)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-left"
                  />
                </div>
                <input
                  type="text"
                  placeholder="دسته‌بندی"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="قیمت فروش (تومان)"
                    value={retailPriceToman}
                    onChange={(e) => setRetailPriceToman(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  />
                  <input
                    type="number"
                    required
                    placeholder="قیمت خرید (تومان)"
                    value={unitCostToman}
                    onChange={(e) => setUnitCostToman(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <input
                  type="number"
                  required
                  placeholder="موجودی اولیه"
                  value={initialQty}
                  onChange={(e) => setInitialQty(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white cursor-pointer"
                >
                  ثبت محصول
                </button>
              </form>
            </div>
          )}

          {activeTab === "cardex" && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden text-xs">
              <div className="border-b px-4 py-3 font-bold text-sm">کاردکس گردش کالا</div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">کالا</th>
                      <th className="p-3">نوع حرکت</th>
                      <th className="p-3">تغییر</th>
                      <th className="p-3">فی بهای تمام‌شده</th>
                      <th className="p-3">مانده</th>
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
                          <td className="p-3 font-bold">{p?.title || v?.sku}</td>
                          <td className="p-3 font-mono">{row.movement_type}</td>
                          <td
                            className={`p-3 font-bold ${
                              row.qty_delta > 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {row.qty_delta > 0 ? `+${row.qty_delta}` : row.qty_delta}
                          </td>
                          <td className="p-3">{formatToman(row.unit_cost)}</td>
                          <td className="p-3 font-bold">{row.balance_after}</td>
                          <td className="p-3">{row.note}</td>
                          <td className="p-3 text-slate-400">{formatFaDate(row.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "purchase" && (
            <form
              onSubmit={handlePurchase}
              className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs"
            >
              <h3 className="font-extrabold text-sm">ثبت فاکتور خرید کالا</h3>
              <select
                value={purVariantId}
                onChange={(e) => setPurVariantId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-white"
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
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="تعداد"
                  value={purQty}
                  onChange={(e) => setPurQty(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5"
                />
                <input
                  type="number"
                  required
                  placeholder="قیمت واحد خرید (تومان)"
                  value={purCostToman}
                  onChange={(e) => setPurCostToman(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2.5"
                />
              </div>
              <input
                type="text"
                value={purNote}
                onChange={(e) => setPurNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white cursor-pointer"
              >
                ثبت فاکتور خرید
              </button>
            </form>
          )}

          {activeTab === "purchase-return" && (
            <form
              onSubmit={handlePurchaseReturn}
              className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs"
            >
              <h3 className="font-extrabold text-sm">ثبت فاکتور برگشت از خرید به تامین‌کننده</h3>
              <select
                value={retVariantId}
                onChange={(e) => setRetVariantId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-white"
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
              <input
                type="number"
                required
                min={1}
                placeholder="تعداد برگشتی"
                value={retQty}
                onChange={(e) => setRetQty(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
              <input
                type="text"
                value={retNote}
                onChange={(e) => setRetNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-rose-600 py-3 font-bold text-white cursor-pointer"
              >
                ثبت برگشت از خرید و کسر از کاردکس
              </button>
            </form>
          )}

          {activeTab === "treasury" && (
            <div className="grid lg:grid-cols-12 gap-6 text-xs">
              <div className="lg:col-span-7 space-y-4">
                <form
                  onSubmit={handleAddCheque}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <h3 className="font-extrabold text-sm">ثبت چک صیادی</h3>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <select
                      value={chqDir}
                      onChange={(e) => setChqDir(e.target.value as any)}
                      className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                    >
                      <option value="INCOMING">چک دریافتی</option>
                      <option value="OUTGOING">چک پرداختی</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="شماره چک"
                      value={chqNum}
                      onChange={(e) => setChqNum(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="شناسه صیادی"
                      value={chqSayadi}
                      onChange={(e) => setChqSayadi(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-left"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="طرف حساب"
                      value={chqParty}
                      onChange={(e) => setChqParty(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <input
                      type="number"
                      required
                      placeholder="مبلغ (تومان)"
                      value={chqAmountToman}
                      onChange={(e) => setChqAmountToman(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <input
                      type="date"
                      required
                      value={chqDueDate}
                      onChange={(e) => setChqDueDate(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white cursor-pointer"
                  >
                    ثبت چک
                  </button>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3">نوع</th>
                        <th className="p-3">طرف حساب</th>
                        <th className="p-3">مبلغ</th>
                        <th className="p-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cheques.map((c) => (
                        <tr key={c.id}>
                          <td className="p-3 font-bold">
                            {c.direction === "INCOMING" ? "وارده" : "صادره"}
                          </td>
                          <td className="p-3">{c.party_name}</td>
                          <td className="p-3 font-bold">{formatToman(c.amount)}</td>
                          <td className="p-3">
                            <select
                              value={c.status}
                              onChange={(e) => handleChequeStatus(c.id, e.target.value)}
                              className="rounded-lg border px-2 py-1"
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

              <div className="lg:col-span-5 space-y-4">
                <form
                  onSubmit={handleAddExpense}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <h3 className="font-extrabold text-sm">ثبت هزینه جاری</h3>
                  <select
                    value={expCat}
                    onChange={(e) => setExpCat(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="اجاره و قبوض">اجاره و قبوض</option>
                    <option value="حقوق و دستمزد">حقوق و دستمزد</option>
                    <option value="بسته‌بندی و کارتن">بسته‌بندی و کارتن</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="شرح هزینه"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      placeholder="مبلغ (تومان)"
                      value={expAmountToman}
                      onChange={(e) => setExpAmountToman(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <select
                      value={expMethod}
                      onChange={(e) => setExpMethod(e.target.value as any)}
                      className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
                    >
                      <option value="CASH">صندوق نقدی</option>
                      <option value="ONLINE_GATEWAY">بانک</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-rose-600 py-2.5 font-bold text-white cursor-pointer"
                  >
                    ثبت هزینه
                  </button>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="font-bold">هزینه‌ها ({expenses.length})</div>
                  {expenses.map((ex) => (
                    <div key={ex.id} className="flex justify-between border-t pt-2">
                      <span>{ex.title}</span>
                      <span className="font-bold text-rose-700">{formatToman(ex.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="grid lg:grid-cols-12 gap-6 text-xs">
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="border-b px-4 py-3 font-bold text-sm">
                  لیست اشخاص و مشتریان ({customers.length})
                </div>
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-3">نام کامل</th>
                      <th className="p-3">شماره موبایل</th>
                      <th className="p-3">آدرس</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-bold">{c.full_name}</td>
                        <td className="p-3 font-mono">{c.mobile}</td>
                        <td className="p-3 text-slate-500">{c.address || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form
                onSubmit={handleAddCustomer}
                className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 space-y-3 h-fit"
              >
                <h3 className="font-extrabold text-sm">افزودن مشتری جدید</h3>
                <input
                  type="text"
                  required
                  placeholder="نام مشتری"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={custMobile}
                  onChange={(e) => setCustMobile(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-left"
                />
                <input
                  type="text"
                  placeholder="آدرس"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white cursor-pointer"
                >
                  ذخیره مشتری
                </button>
              </form>
            </div>
          )}

          {activeTab === "journals" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white border p-4">
                  <div className="text-slate-500">فروش کل</div>
                  <div className="text-base font-extrabold text-indigo-700 mt-1">
                    {formatToman(pnl.totalRevenue)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white border p-4">
                  <div className="text-slate-500">بهای تمام‌شده (COGS)</div>
                  <div className="text-base font-extrabold mt-1">
                    {formatToman(pnl.totalCogs)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white border p-4">
                  <div className="text-slate-500">هزینه‌های جاری</div>
                  <div className="text-base font-extrabold text-rose-700 mt-1">
                    {formatToman(pnl.totalExpenses)}
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="text-emerald-800 font-bold">سود خالص واقعی</div>
                  <div className="text-base font-extrabold text-emerald-800 mt-1">
                    {formatToman(pnl.netProfit)}
                  </div>
                </div>
              </div>

              {journals.map((j) => {
                const lines = j.journal_lines || [];
                return (
                  <div key={j.id} className="rounded-2xl border bg-white p-4">
                    <div className="flex justify-between font-bold border-b pb-2 mb-2">
                      <span>
                        سند #{j.entry_number} — {j.description}
                      </span>
                      <span className="text-slate-400">{j.entry_date}</span>
                    </div>
                    <table className="w-full text-right">
                      <tbody>
                        {lines.map((l: any, idx: number) => {
                          const acc = Array.isArray(l.chart_of_accounts)
                            ? l.chart_of_accounts[0]
                            : l.chart_of_accounts;
                          return (
                            <tr key={idx} className="border-t border-slate-50">
                              <td className="py-1.5">
                                <span className="font-mono text-slate-400 ml-2">{acc?.code}</span>
                                {acc?.name}
                              </td>
                              <td className="py-1.5 text-emerald-700 font-bold">
                                {Number(l.debit) > 0 ? formatToman(l.debit) : "—"}
                              </td>
                              <td className="py-1.5 text-rose-700 font-bold">
                                {Number(l.credit) > 0 ? formatToman(l.credit) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "settings" && (
            <form
              onSubmit={handleSaveSettings}
              className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs"
            >
              <h3 className="font-extrabold text-sm">
                تنظیمات فرستنده روی لیبل پستی، کارت بانکی و اینماد
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  dir="ltr"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="تلفن فرستنده"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-left"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={senderPostalCode}
                  onChange={(e) => setSenderPostalCode(e.target.value)}
                  placeholder="کد پستی فرستنده"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-left font-mono"
                />
              </div>
              <input
                type="text"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                placeholder="آدرس کامل فرستنده"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  dir="ltr"
                  value={bankCardNumber}
                  onChange={(e) => setBankCardNumber(e.target.value)}
                  placeholder="شماره کارت"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-left font-mono"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={enamadCode}
                  onChange={(e) => setEnamadCode(e.target.value)}
                  placeholder="کد اینماد"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-left"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white cursor-pointer"
              >
                ذخیره تنظیمات
              </button>
            </form>
          )}
        </main>
      </div>

      {/* F7 Fast Sales Invoice Modal */}
      <SalesInvoiceF7Modal
        open={f7Open}
        onClose={() => setF7Open(false)}
        variants={variants}
        customers={customers}
        onSaved={async (msg) => {
          notify("ok", msg);
          await loadData();
        }}
      />

      {/* Official Standard Postal Label Modal */}
      {labelPrintState && (
        <PostalLabelModal
          orders={labelPrintState.orders}
          tenant={tenant}
          mode={labelPrintState.mode}
          onClose={() => setLabelPrintState(null)}
        />
      )}

      {/* Thermal / A4 Official Invoice Modal */}
      {invoicePrintState && (
        <OfficialInvoicePrintModal
          order={invoicePrintState.order}
          tenant={tenant}
          mode={invoicePrintState.mode}
          onClose={() => setInvoicePrintState(null)}
        />
      )}
    </div>
  );
}
