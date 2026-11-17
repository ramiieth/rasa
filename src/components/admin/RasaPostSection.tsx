"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Printer,
  Download,
  CheckCircle2,
  Ban,
  PackageSearch,
  Send,
} from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";
import { SHIPPING_METHODS } from "@/lib/shipping-calculator";
import { PrintLabelMode } from "./PostalLabelModal";

export function RasaPostSection({
  subTab,
  orders,
  tenant,
  onReload,
  onNotify,
  onOpenPrintModal,
}: {
  subTab: "post-batch" | "post-manual" | "post-list";
  orders: any[];
  tenant: { name: string; slug: string; shippingWalletBalance: number };
  onReload: () => Promise<void>;
  onNotify: (type: "ok" | "err", text: string) => void;
  onOpenPrintModal: (ordersToPrint: any[], mode: PrintLabelMode) => void;
}) {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [packageSize, setPackageSize] = useState("کارتن سایز ۳");
  const [batchCarrier, setBatchCarrier] = useState("PISHTAZ");

  const [selectedPrintIds, setSelectedPrintIds] = useState<string[]>([]);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);

  // Manual parcel form
  const [mName, setMName] = useState("");
  const [mMobile, setMMobile] = useState("");
  const [mWeight, setMWeight] = useState("500");
  const [mPostalCode, setMPostalCode] = useState("");
  const [mProvince, setMProvince] = useState("تهران");
  const [mCity, setMCity] = useState("تهران");
  const [mAddress, setMAddress] = useState("");
  const [mValueToman, setMValueToman] = useState("1500000");
  const [mCarrier, setMCarrier] = useState("PISHTAZ");
  const [mPackSize, setMPackSize] = useState("کارتن سایز ۳");
  const [mSendSms, setMSendSms] = useState(true);

  const readyForBarcode = orders.filter((o) => o.channel === "ONLINE");
  const barcodeList = orders.filter((o) => o.tracking_barcode);

  async function handleBatchIssue() {
    if (selectedBatchIds.length === 0) return;
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "BATCH_ISSUE_BARCODE",
        orderIds: selectedBatchIds,
        packageSize,
        carrier: batchCarrier,
      }),
    });
    if (res.ok) {
      onNotify("ok", `بارکد پستی برای ${selectedBatchIds.length} سفارش به‌صورت گروهی صادر شد.`);
      setSelectedBatchIds([]);
      await onReload();
    }
  }

  async function handleManualParcel(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "MANUAL_PARCEL",
        customerName: mName,
        customerMobile: mMobile,
        weightGrams: Number(mWeight),
        postalCode: mPostalCode,
        province: mProvince,
        city: mCity,
        address: mAddress,
        parcelValueToman: Number(mValueToman),
        carrier: mCarrier,
        packageSize: mPackSize,
        sendSms: mSendSms,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      onNotify("err", json.error || "خطا در صدور بارکد دستی");
      return;
    }
    setMName("");
    setMMobile("");
    setMPostalCode("");
    setMAddress("");
    onNotify("ok", `بارکد دستی #${json.orderNumber} (${json.barcode}) با موفقیت صادر شد.`);
    await onReload();
  }

  async function handleSuspendToggle(order: any) {
    const res = await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "TOGGLE_SUSPEND",
        orderId: order.id,
        isSuspended: !order.is_suspended,
      }),
    });
    if (res.ok) {
      onNotify("ok", order.is_suspended ? "مرسوله از تعلیق خارج شد." : "مرسوله در حالت تعلیق قرار گرفت.");
      await onReload();
    }
  }

  async function triggerPrint(mode: PrintLabelMode) {
    const targets = barcodeList.filter((o) => selectedPrintIds.includes(o.id));
    if (targets.length === 0) {
      onNotify("err", "حداقل یک ردیف را برای چاپ تیک بزنید.");
      return;
    }
    setPrintMenuOpen(false);
    await fetch("/api/v1/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "INCREMENT_PRINT", orderIds: selectedPrintIds }),
    });
    onOpenPrintModal(targets, mode);
    await onReload();
  }

  function exportExcelCsv() {
    const headers = ["ردیف", "شماره سفارش", "بارکد پستی", "گیرنده", "موبایل", "وزن", "تعداد پرینت"];
    const rows = barcodeList.map((o, idx) => [
      idx + 1,
      o.order_number,
      o.tracking_barcode,
      o.customer_name,
      o.customer_mobile || "",
      o.total_weight_grams || 500,
      o.print_count || 0,
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rasa-barcodes-${Date.now()}.csv`;
    a.click();
  }

  if (subTab === "post-batch") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          در صدور بارکد دقت نمایید: در صورت مغایرت وزن و ابعاد مرسوله، مطابق مقررات شرکت ملی پست جریمه اعمال خواهد شد.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={batchCarrier}
              onChange={(e) => setBatchCarrier(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 font-bold bg-white"
            >
              {SHIPPING_METHODS.filter((m) => !m.isPostPaid).map((m) => (
                <option key={m.code} value={m.code}>
                  {m.title}
                </option>
              ))}
            </select>
            <select
              value={packageSize}
              onChange={(e) => setPackageSize(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 font-bold bg-white"
            >
              <option value="پاکت حبابدار">پاکت حبابدار</option>
              <option value="کارتن سایز ۱">کارتن سایز ۱</option>
              <option value="کارتن سایز ۲">کارتن سایز ۲</option>
              <option value="کارتن سایز ۳">کارتن سایز ۳</option>
              <option value="کارتن سایز ۴">کارتن سایز ۴</option>
            </select>
          </div>
          <button
            onClick={handleBatchIssue}
            disabled={selectedBatchIds.length === 0}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
          >
            صدور بارکد گروهی ({selectedBatchIds.length} سفارش)
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3.5">انتخاب</th>
                <th className="p-3.5">شماره سفارش</th>
                <th className="p-3.5">خریدار</th>
                <th className="p-3.5">روش ارسال</th>
                <th className="p-3.5">وزن</th>
                <th className="p-3.5">بارکد فعلی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readyForBarcode.map((o) => {
                const checked = selectedBatchIds.includes(o.id);
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedBatchIds((prev) =>
                            checked ? prev.filter((id) => id !== o.id) : [...prev, o.id]
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>
                    <td className="p-3.5 font-extrabold">#{o.order_number}</td>
                    <td className="p-3.5">{o.customer_name}</td>
                    <td className="p-3.5">{o.shipping_carrier}</td>
                    <td className="p-3.5">{o.total_weight_grams || 500} گرم</td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {o.tracking_barcode || "صادر نشده"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (subTab === "post-manual") {
    return (
      <form
        onSubmit={handleManualParcel}
        className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4 text-xs shadow-2xs"
      >
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-amber-800 font-bold">
          این بخش ویژه ثبت مرسوله پستی به‌صورت دستی (سفارش‌های اینستاگرام یا تلفنی) بدون نیاز به فاکتور قبلی است.
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="نام و نام خانوادگی گیرنده"
            value={mName}
            onChange={(e) => setMName(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <input
            type="tel"
            required
            dir="ltr"
            placeholder="09123456789"
            value={mMobile}
            onChange={(e) => setMMobile(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-left"
          />
          <input
            type="number"
            required
            placeholder="وزن بسته (گرم)"
            value={mWeight}
            onChange={(e) => setMWeight(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5"
          />
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <input
            type="text"
            dir="ltr"
            placeholder="کد پستی ۱۰ رقمی"
            value={mPostalCode}
            onChange={(e) => setMPostalCode(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-left font-mono"
          />
          <input
            type="text"
            placeholder="استان مقصد"
            value={mProvince}
            onChange={(e) => setMProvince(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <input
            type="text"
            placeholder="شهر مقصد"
            value={mCity}
            onChange={(e) => setMCity(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <input
            type="number"
            placeholder="ارزش مرسوله (تومان)"
            value={mValueToman}
            onChange={(e) => setMValueToman(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5"
          />
        </div>
        <input
          type="text"
          required
          placeholder="آدرس کامل گیرنده..."
          value={mAddress}
          onChange={(e) => setMAddress(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
        />
        <div className="grid sm:grid-cols-3 gap-3 items-center">
          <select
            value={mCarrier}
            onChange={(e) => setMCarrier(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-bold"
          >
            {SHIPPING_METHODS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.title}
              </option>
            ))}
          </select>
          <select
            value={mPackSize}
            onChange={(e) => setMPackSize(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-bold"
          >
            <option value="پاکت حبابدار">پاکت حبابدار</option>
            <option value="کارتن سایز ۱">کارتن سایز ۱</option>
            <option value="کارتن سایز ۲">کارتن سایز ۲</option>
            <option value="کارتن سایز ۳">کارتن سایز ۳</option>
          </select>
          <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={mSendSms}
              onChange={(e) => setMSendSms(e.target.checked)}
              className="h-4 w-4 accent-emerald-600"
            />
            ارسال پیامک کد رهگیری به مشتری
          </label>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-extrabold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <Send className="h-4 w-4" />
          ثبت و صدور بارکد دستی
        </button>
      </form>
    );
  }

  // post-list: لیست بارکدها دقیقاً مطابق ویدیوی دوم (هایلایت زرد پرینت‌نشده‌ها + منوی ۵ حالته پرینت + تعلیق + اکسل)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs">
        <div className="flex flex-wrap items-center gap-2 relative">
          <button
            onClick={() => setPrintMenuOpen(!printMenuOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-indigo-600 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            پرینت لیبل ({selectedPrintIds.length})
          </button>

          {printMenuOpen && (
            <div className="absolute top-11 right-0 z-30 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1.5 space-y-1">
              {[
                { mode: "A6", label: "پرینت A6 (بدون نام محصول)" },
                { mode: "A5_WITH_ITEMS", label: "پرینت A5 (با محصول)" },
                { mode: "A6_WITH_ITEMS", label: "پرینت A6 (با محصول)" },
                { mode: "A5_ITEMS_END", label: "پرینت A5 (محصول در انتها)" },
                { mode: "A6_ITEMS_END", label: "پرینت A6 (محصول در انتها)" },
              ].map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => triggerPrint(opt.mode as PrintLabelMode)}
                  className="w-full text-right rounded-lg px-3 py-2 font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() =>
              setSelectedPrintIds(
                selectedPrintIds.length === barcodeList.length
                  ? []
                  : barcodeList.map((o) => o.id)
              )
            }
            className="rounded-xl border border-slate-300 px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            انتخاب همه (پرینت)
          </button>
        </div>

        <button
          onClick={exportExcelCsv}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          خروجی اکسل (CSV)
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">پرینت</th>
                <th className="p-3">سفارش</th>
                <th className="p-3">بارکد پستی</th>
                <th className="p-3">نام گیرنده</th>
                <th className="p-3">وزن</th>
                <th className="p-3">تعداد پرینت</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {barcodeList.map((o) => {
                const unprinted = Number(o.print_count || 0) === 0;
                const checked = selectedPrintIds.includes(o.id);
                return (
                  <tr
                    key={o.id}
                    className={
                      o.is_suspended
                        ? "bg-rose-50/60"
                        : unprinted
                        ? "bg-amber-50/75"
                        : "bg-white hover:bg-slate-50"
                    }
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedPrintIds((prev) =>
                            checked ? prev.filter((id) => id !== o.id) : [...prev, o.id]
                          )
                        }
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </td>
                    <td className="p-3 font-extrabold">#{o.order_number}</td>
                    <td className="p-3 font-mono text-slate-700">{o.tracking_barcode}</td>
                    <td className="p-3 font-bold">
                      {o.customer_name}
                      <div className="text-[10px] text-slate-400 font-mono">
                        {o.customer_mobile}
                      </div>
                    </td>
                    <td className="p-3">{o.total_weight_grams || 500} گرم</td>
                    <td className="p-3">
                      {unprinted ? (
                        <span className="rounded-full bg-amber-200/80 px-2 py-0.5 font-bold text-amber-900">
                          ۰ (پرینت نشده)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {o.print_count} بار
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">{formatFaDate(o.created_at)}</td>
                    <td className="p-3 flex items-center gap-1.5">
                      <a
                        href={`/s/${tenant.slug}/track`}
                        target="_blank"
                        className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700"
                      >
                        <PackageSearch className="h-3 w-3" />
                        ردیابی
                      </a>
                      <button
                        onClick={() => handleSuspendToggle(o)}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700 cursor-pointer"
                      >
                        <Ban className="h-3 w-3" />
                        {o.is_suspended ? "رفع تعلیق" : "تعلیق"}
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
  );
}
