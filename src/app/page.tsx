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
} from "lucide-react";

const PLANS = [
  { id: "lite", name: "پایه — لایت", cash: 19900000, desc: "فروشگاه آنلاین + فید ترب + درگاه پرداخت" },
  { id: "standard", name: "استاندارد (پیشنهادی)", cash: 34900000, desc: "فروشگاه + صندوق حضوری + کاردکس انبار" },
  { id: "pro", name: "حرفه‌ای + اقساطی", cash: 42000000, desc: "تمام امکانات + حسابداری دوبل + درگاه‌های BNPL" },
];

const ADDONS = [
  { id: "post", label: "اتصال پیشخوان پستی و بارکد آنی", price: 3500000 },
  { id: "bnpl", label: "ماژول درگاه‌های اقساطی (اسنپ‌پی / ترب‌پی)", price: 5000000 },
  { id: "seo", label: "پکیج سئو و ورود ۱۰۰ محصول اول", price: 6000000 },
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
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-sm">
              رَ
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-900">رَسا (Rasa)</div>
              <div className="text-xs text-slate-500">
                پلتفرم یکپارچه فروش، انبار و حسابداری
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600">امکانات</a>
            <a href="#calculator" className="hover:text-indigo-600">محاسبه‌گر هزینه</a>
            <a href="#provision" className="rounded-lg bg-indigo-50 px-3.5 py-2 text-indigo-700 font-semibold hover:bg-indigo-100">
              ساخت فروشگاه تستی
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-16">
        <section className="grid gap-10 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-6 pt-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <Sparkles className="h-3.5 w-3.5" />
              نسخه آزمایشی یکپارچه: ویترین + صندوق POS + کاردکس + حسابداری دوبل
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-slate-900">
              مدیریت هم‌زمان <span className="text-indigo-600">فروشگاه اینترنتی</span> و{" "}
              <span className="text-indigo-600">صندوق مغازه</span> با یک انبار واحد
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              پلتفرم <strong>رَسا (Rasa)</strong> تمام نیازهای فروش آنلاین و حضوری را یکجا متصل می‌کند:
              کسر موجودی لحظه‌ای در کاردکس، محاسبه بهای تمام‌شده میانگین موزون، ثبت خودکار سند حسابداری دوبل،
              صندوق بارکدخوان و خروجی استاندارد ترب.
            </p>

            <div id="features" className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <PackageCheck className="h-6 w-6 text-indigo-600 mb-2" />
                <h3 className="font-bold text-sm">کاردکس اتمیک انبار</h3>
                <p className="text-xs text-slate-500 mt-1">
                  جلوگیری از بیش‌فروشی هم‌زمان در سایت و مغازه با ثبت لحظه‌ای ورود و خروج.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <ReceiptText className="h-6 w-6 text-emerald-600 mb-2" />
                <h3 className="font-bold text-sm">حسابداری دوبل خودکار</h3>
                <p className="text-xs text-slate-500 mt-1">
                  صدور خودکار سند خرید، فروش و بهای تمام‌شده با گزارش سود و زیان واقعی.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <Store className="h-6 w-6 text-amber-600 mb-2" />
                <h3 className="font-bold text-sm">صندوق فروش و فید ترب</h3>
                <p className="text-xs text-slate-500 mt-1">
                  فروش سریع با بارکدخوان، چاپ فیش و خروجی JSON آماده برای اتصال به ترب.
                </p>
              </div>
            </div>
          </div>

          <div
            id="provision"
            className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
          >
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => { setAuthTab("create"); setError(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  authTab === "create"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600"
                }`}
              >
                ساخت فروشگاه تستی آنی
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab("login"); setError(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
                  authTab === "login"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600"
                }`}
              >
                <LogIn className="h-4 w-4" />
                ورود به پنل
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authTab === "create" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نام فروشگاه
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: گالری کفش آراد"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شناسه انگلیسی فروشگاه (آدرس ویترین: /s/slug)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="arad-shoes"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-left focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ایمیل مدیر
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-left focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-left focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer"
              >
                {loading
                  ? "در حال آماده‌سازی..."
                  : authTab === "create"
                  ? "راه‌اندازی فوری فروشگاه تستی"
                  : "ورود به داشبورد رَسا"}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <section
          id="calculator"
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-indigo-600" />
              <div>
                <h2 className="text-xl font-extrabold">محاسبه‌گر پکیج و برآورد هزینه راه‌اندازی</h2>
                <p className="text-xs text-slate-500">
                  برآورد شفاف هزینه نقدی و اقساطی برای نسخه کامل کسب‌وکارها
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
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
                className={`text-right rounded-2xl border p-4 transition cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-bold text-slate-900">{plan.name}</div>
                <div className="text-xs text-slate-500 mt-1">{plan.desc}</div>
                <div className="mt-3 text-base font-extrabold text-indigo-700">
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
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2
                      className={`h-4 w-4 ${active ? "text-emerald-600" : "text-slate-300"}`}
                    />
                    {addon.label}
                  </span>
                  <span>+{addon.price.toLocaleString("fa-IR")}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 text-white p-5">
            <div>
              <div className="text-xs text-slate-300">برآورد کل پکیج انتخابی:</div>
              <div className="text-2xl font-extrabold mt-1">
                {totalPrice.toLocaleString("fa-IR")} تومان
              </div>
            </div>
            {isInstallment && (
              <div className="text-left">
                <div className="text-xs text-slate-300">
                  پیش‌پرداخت {prepayment.toLocaleString("fa-IR")} تومان + ۱۲ قسط:
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  ماهانه {monthlyInstallment.toLocaleString("fa-IR")} تومان
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
