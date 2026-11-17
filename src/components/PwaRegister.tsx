"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white px-4 py-3 shadow-xl text-xs">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
        رَ
      </div>
      <div>
        <div className="font-bold text-slate-900">نصب اپلیکیشن رَسا (PWA)</div>
        <div className="text-[11px] text-slate-500">دسترسی سریع به صندوق و پنل مدیریت</div>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 font-bold text-white hover:bg-indigo-700 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5" />
        نصب
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-600 cursor-pointer"
        aria-label="بستن"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
