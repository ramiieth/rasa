"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Calculator,
  PackageCheck,
  ReceiptText,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  LogIn,
  ShieldCheck,
  Zap,
  Layers,
  TrendingUp,
} from "lucide-react";

const PLANS = [
  {
    id: "lite",
    name: "پایه — آنلاین‌شاپ",
    cash: 19900000,
    badge: "شروع سریع",
    desc: "ویترین فروشگاه + اتصال ترب + سبد خرید و درگاه بانکی",
  },
  {
    id: "standard",
    name: "استاندارد — یکپارچه",
    cash: 34900000,
    badge: "پرفروش‌ترین",
    desc: "فروشگاه آنلاین + صندوق حضوری POS + کاردکس انبار",
  },
  {
    id: "pro",
    name: "حرفه‌ای — سازمانی",
    cash: 42000000,
    badge: "کامل‌ترین",
    desc: "تمام امکانات + حسابداری دوبل + ماژول درگاه‌های اقساطی BNPL",
  },
];

const ADDONS = [
  { id: "post", label: "پیشخوان پستی و صدور آنی بارکد", price: 3500000 },
  { id: "bnpl", label: "درگاه‌های اقساطی (اسنپ‌پی / ترب‌پی / دیجی‌پی)", price: 5000000 },
  { id: "seo", label: "پکیج سئو تکنیکال و ورود ۱۰۰ محصول اول", price: 6000000 },
];

export default function RasaLandingPage() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<"create" | "login">("create");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["post"]);
  const [isInstallment, setIsInstallment] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const basePrice = PLANS.find((p) => p.id === selectedPlan)?.cash ?? 34900000;
  const addonsTotal = selectedAddons.reduce(
    (sum, id) => sum + (ADDONS.find((a) => a.id === id)?.price ?? 0),
    0
  );
  const totalPrice = basePrice + addonsTotal;
  const prepayment = 4900000;
  const monthlyInstallment = Math.round(((totalPrice - prepayment) * 1.12) / 12);

  function toggleAddon(id: string) {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint =
        authTab === "create" ? "/api/v1/auth/provision" : "/api/v1/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName,
          slug: storeSlug,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در انجام عملیات");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch {
      setError("خطا در ارتباط با سرور");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold text-lg shadow-sm shadow-indigo-500/20">
              رَ
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-slate-900">
                رَسا <span className="text-xs font-semibold text-indigo-600">Rasa OS</span>
              </div>
              <div className="text-[11px] text-slate-500">
                پلتفرم یکپارچه فروش، انبار و حسابداری
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">امکانات هسته</a>
            <a href="#comparison" className="hover:text-indigo-600 transition">تفاوت با فروشگاه‌سازها</a>
            <a href="#calculator" className="hover:text-indigo-600 transition">برآورد هزینه</a>
            <a
              href="#provision"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600 transition"
            >
              ساخت فروشگاه تستی
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-20">
        {/* Hero + Zero-Touch Provisioning */}
        <section className="grid gap-10 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-7 pt-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 border border-indigo-200/70">
              <Sparkles className="h-3.5 w-3.5" />
              سیستم‌عامل تجارت یکپارچه (Omnichannel Retail OS)
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold leading-[1.25] text-slate-900">
              یک انبار، یک حسابداری؛{" "}
              <span className="bg-gradient-to-l from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                فروش هم‌زمان در سایت و مغازه
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              <strong>رَسا</strong> فروشگاه اینترنتی، صندوق فروش حضوری (POS)، کاردکس اتمیک انبار،
              حسابداری دوبل و فید ترب را بدون نیاز به اکسل و افزونه‌های پراکنده در یک پنل ابری واحد به هم متصل می‌کند.
            </p>

            <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">کاردکس اتمیک انبار</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  کسر هم‌زمان موجودی مغازه و سایت با محاسبه خودکار میانگین موزون خرید.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">حسابداری دوبل خودکار</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  ثبت تراز بدهکار/بستانکار و محاسبه سود ناخالص واقعی پس از کسر COGS.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-3">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">صندوق POS + فید ترب</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  اسکن بارکدخوان سخت‌افزاری، چاپ فیش و اندپوینت JSON استاندارد ترب.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ایزولاسیون داده‌ها با RLS
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                راه‌اندازی فروشگاه دمو در ۱۰ ثانیه
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" />
                آماده اتصال به درگاه و پست
              </span>
            </div>
          </div>

          {/* Auth / Instant Provision Card */}
          <div
            id="provision"
            className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl shadow-slate-200/60"
          >
            <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6">
              <button
                type="button"
                onClick={() => { setAuthTab("create"); setError(""); }}
                className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  authTab === "create"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ساخت فروشگاه تستی آنی
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setError(""); }}
                className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authTab === "login"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LogIn className="h-4 w-4" />
                ورود به پنل
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authTab === "create" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    نام فروشگاه
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: گالری کفش آراد"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شناسه انگلیسی فروشگاه (آدرس ویترین: <span dir="ltr">/s/slug</span>)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="arad-shoes"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-left font-mono focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ایمیل مدیر
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-left focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رمز عبور (حداقل ۶ کاراکتر)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  dir="ltr"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-left focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none transition"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer"
              >
                {loading
                  ? "در حال آماده‌سازی دیتابیس فروشگاه..."
                  : authTab === "create"
                  ? "راه‌اندازی فوری فروشگاه + ۲ کالای نمونه"
                  : "ورود به داشبورد رَسا"}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        {/* Comparison strip */}
        <section id="comparison" className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: "فروشگاه‌ساز معمولی",
              tone: "text-slate-500",
              items: [
                "فقط ویترین آنلاین بدون صندوق حضوری",
                "کسر موجودی ساده بدون کاردکس و بهای تمام‌شده",
                "نیاز به نرم‌افزار حسابداری جداگانه",
              ],
            },
            {
              title: "رَسا (Rasa OS)",
              tone: "text-indigo-700",
              highlight: true,
              items: [
                "انبار واحد برای سایت + مغازه با قفل اتمیک",
                "سند حسابداری دوبل خودکار و سود و زیان واقعی",
                "فید استاندارد ترب + آماده اتصال پست و BNPL",
              ],
            },
            {
              title: "حسابداری دسکتاپ سنتی",
              tone: "text-slate-500",
              items: [
                "عدم اتصال بومی به سبد خرید سایت و ترب",
                "وابسته به کامپیوتر مغازه و بکاپ دستی",
                "نیازمند وارد کردن دستی سفارش‌های اینترنتی",
              ],
            },
          ].map((col, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border p-6 space-y-4 ${
                col.highlight
                  ? "border-indigo-500 bg-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                  : "border-slate-200 bg-white/70"
              }`}
            >
              <div className={`font-extrabold text-base flex items-center gap-2 ${col.tone}`}>
                {col.highlight && <TrendingUp className="h-5 w-5 text-indigo-600" />}
                {col.title}
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {col.items.map((text, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        col.highlight ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Interactive Cost Calculator */}
        <section
          id="calculator"
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  محاسبه‌گر پکیج و برآورد هزینه راه‌اندازی
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تعرفه شفاف نقدی و اقساطی برای پیاده‌سازی اختصاصی کسب‌وکارها
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              محاسبه اقساطی (۱۲ ماهه)
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`text-right rounded-2xl border p-5 transition cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{plan.name}</span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                    {plan.badge}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.desc}</div>
                <div className="mt-4 text-lg font-extrabold text-indigo-700">
                  {plan.cash.toLocaleString("fa-IR")} تومان
                </div>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {ADDONS.map((addon) => {
              const active = selectedAddons.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-right">
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${active ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    {addon.label}
                  </span>
                  <span className="shrink-0 mr-2">+{addon.price.toLocaleString("fa-IR")}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 text-white p-6">
            <div>
              <div className="text-xs text-slate-400">برآورد کل پکیج انتخابی:</div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1">
                {totalPrice.toLocaleString("fa-IR")} تومان
              </div>
            </div>
            {isInstallment && (
              <div className="text-left">
                <div className="text-xs text-slate-400">
                  پیش‌پرداخت {prepayment.toLocaleString("fa-IR")} تومان + ۱۲ قسط:
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  ماهانه {monthlyInstallment.toLocaleString("fa-IR")} تومان
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        رَسا (Rasa OS) — پلتفرم یکپارچه تجارت الکترونیک، انبارداری کاردکس و حسابداری دوبل
      </footer>
    </div>
  );
}
