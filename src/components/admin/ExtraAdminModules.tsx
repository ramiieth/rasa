"use client";

import { useState } from "react";
import { Puzzle, FileEdit, Download, Video, CheckCircle2 } from "lucide-react";

export function ExtraAdminModules({
  activeTab,
  onNotify,
}: {
  activeTab: "plugins" | "blog" | "drivers" | "tutorials";
  onNotify: (type: "ok" | "err", text: string) => void;
}) {
  const [plugins, setPlugins] = useState([
    {
      id: "wholesale",
      title: "افزونه فروش عمده و همکاری (B2B)",
      desc: "نمایش قیمت عمده مجزا و حداقل تعداد خرید برای مشتریان عمده تاییدشده",
      active: true,
    },
    {
      id: "story",
      title: "افزونه استوری‌ساز صفحه اصلی",
      desc: "نمایش استوری‌های حلقه‌ای مشابه اینستاگرام در بالای ویترین فروشگاه",
      active: true,
    },
    {
      id: "torob",
      title: "اتصال خودکار به موتور ترب و ایمالز",
      desc: "تولید فید استاندارد لحظه‌ای برای همگام‌سازی قیمت و موجودی",
      active: true,
    },
    {
      id: "bale",
      title: "اتصال بازوی فروشگاهی «بله من»",
      desc: "همگام‌سازی کاتالوگ محصولات با بازوی فروشگاهی پیام‌رسان بله",
      active: false,
    },
  ]);

  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "راهنمای انتخاب سایز کفش و پوشاک در خرید اینترنتی",
      category: "راهنمای خرید",
      date: "۱۴۰۵/۰۸/۲۷",
    },
    {
      id: 2,
      title: "شرایط خرید اقساطی ۴ ماهه با شاپینو، اسنپ‌پی و ترب‌پی",
      category: "اخبار فروشگاه",
      date: "۱۴۰۵/۰۸/۲۵",
    },
  ]);
  const [postTitle, setPostTitle] = useState("");
  const [postCat, setPostCat] = useState("مقالات سئو");

  if (activeTab === "plugins") {
    return (
      <div className="space-y-4 text-xs">
        <div className="font-extrabold text-sm flex items-center gap-2">
          <Puzzle className="h-4 w-4 text-indigo-600" />
          افزونه‌ها و ماژول‌های متصل به فروشگاه
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {plugins.map((pl) => (
            <div
              key={pl.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">{pl.title}</div>
                <p className="text-slate-500 leading-relaxed">{pl.desc}</p>
              </div>
              <button
                onClick={() => {
                  setPlugins((prev) =>
                    prev.map((item) =>
                      item.id === pl.id ? { ...item, active: !item.active } : item
                    )
                  );
                  onNotify("ok", `وضعیت «${pl.title}» تغییر کرد.`);
                }}
                className={`shrink-0 rounded-xl px-3.5 py-2 font-bold cursor-pointer ${
                  pl.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {pl.active ? "فعال شده" : "فعال‌سازی"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "blog") {
    return (
      <div className="grid lg:grid-cols-12 gap-6 text-xs">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b px-4 py-3 font-bold text-sm flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-indigo-600" />
            مقالات وبلاگ و سئو ({posts.length})
          </div>
          <div className="divide-y divide-slate-100">
            {posts.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{p.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.category}</div>
                </div>
                <span className="text-slate-400">{p.date}</span>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!postTitle) return;
            setPosts((prev) => [
              { id: Date.now(), title: postTitle, category: postCat, date: "۱۴۰۵/۰۸/۲۸" },
              ...prev,
            ]);
            setPostTitle("");
            onNotify("ok", "مقاله جدید در وبلاگ فروشگاه منتشر شد.");
          }}
          className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-3 h-fit"
        >
          <h3 className="font-extrabold text-sm">انتشار نوشته جدید برای سئو</h3>
          <input
            type="text"
            required
            placeholder="عنوان مقاله..."
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <input
            type="text"
            placeholder="دسته‌بندی مقاله"
            value={postCat}
            onChange={(e) => setPostCat(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <textarea
            rows={4}
            placeholder="متن کامل مقاله و کلمات کلیدی سئو..."
            className="w-full rounded-xl border border-slate-300 p-3"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white cursor-pointer"
          >
            انتشار در وبلاگ
          </button>
        </form>
      </div>
    );
  }

  if (activeTab === "drivers") {
    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {[
          {
            name: "درایور فیش‌پرینتر حرارتی (80mm / 58mm)",
            desc: "سازگار با چاپگرهای حرارتی USB و شبکه به همراه WebSerial",
          },
          {
            name: "درایور لیبل‌پرینتر بارکد و پست",
            desc: "تنظیم خودکار سایز کاغذ A6 و لیبل ۱۵×۱۰ سانتی‌متر",
          },
          {
            name: "پیکربندی بارکدخوان دو بعدی و خطی",
            desc: "تنظیم حالت HID کیبورد و ارسال خودکار کلید Enter",
          },
          {
            name: "نرم‌افزار پشتیبانی از راه دور (AnyDesk)",
            desc: "جهت اتصال کارشناس پشتیبانی فنی برای نصب پرینتر",
          },
        ].map((d, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="font-extrabold text-slate-900 text-sm">{d.name}</div>
              <p className="text-slate-500 mt-1 leading-relaxed">{d.desc}</p>
            </div>
            <button
              onClick={() => onNotify("ok", `لینک دریافت «${d.name}» آماده شد.`)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 font-bold text-white hover:bg-indigo-600 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> دریافت و راهنما
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
      {[
        "آموزش ثبت فاکتور فروش حضوری با بارکدخوان (F7)",
        "آموزش صدور بارکد گروهی و چاپ لیبل A6 اداره پست و ماهکس",
        "آموزش ثبت فاکتور خرید و بررسی کاردکس انبار",
        "آموزش اتصال به ترب و درگاه‌های اقساطی (شاپینو، اسنپ‌پی، ترب‌پی)",
        "آموزش صدور بارکد دستی برای سفارش‌های اینستاگرام",
        "آموزش تراز صندوق، کارتخوان و چک‌های صیادی",
      ].map((t, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{t}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" /> آماده مشاهده در پنل
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
