"use client";

import { Printer, X } from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";
import { generateCode128SvgDataUrl, generateQrSvgDataUrl } from "@/lib/barcode-svg";

export type PrintLabelMode =
  | "A6"
  | "A5_WITH_ITEMS"
  | "A6_WITH_ITEMS"
  | "A5_ITEMS_END"
  | "A6_ITEMS_END";

export function PostalLabelModal({
  orders,
  tenant,
  mode,
  onClose,
}: {
  orders: any[];
  tenant: {
    name: string;
    senderPhone: string;
    senderPostalCode: string;
    senderAddress: string;
  };
  mode: PrintLabelMode;
  onClose: () => void;
}) {
  if (!orders || orders.length === 0) return null;

  const showItems = mode !== "A6";
  const isA5 = mode === "A5_WITH_ITEMS" || mode === "A5_ITEMS_END";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 space-y-5">
        <div className="no-print flex items-center justify-between border-b pb-3">
          <div className="font-extrabold text-sm">
            پیش‌نمایش چاپ استاندارد شرکت ملی پست / ماهکس ({orders.length} برگه — قالب {mode})
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              ارسال به پرینتر
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <X className="h-4 w-4" /> بستن
            </button>
          </div>
        </div>

        <div className={`grid gap-6 ${isA5 ? "grid-cols-1" : "md:grid-cols-2"}`}>
          {orders.map((order) => {
            const barcodeVal = order.tracking_barcode || "198450000000001001";
            const barcodeSvg = generateCode128SvgDataUrl(barcodeVal);
            const qrSvg = generateQrSvgDataUrl(
              `RASA|${order.order_number}|${barcodeVal}|${order.customer_mobile || ""}`
            );
            const items = order.order_items || [];
            const isCod = order.shipping_carrier === "COD";

            return (
              <div
                key={order.id}
                className="border-2 border-slate-900 bg-white p-3 text-[11px] text-slate-900 break-inside-avoid space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <div className="font-extrabold text-xs border border-slate-800 px-2 py-1 rounded">
                    پست / {order.shipping_carrier || "پیشتاز"}
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-xs">شرکت واسط اینترنتی (رَسا)</div>
                    <div className="text-[10px] text-slate-600">
                      پشتیبانی: {tenant.senderPhone || "۰۹۱۱۶۳۶۷۹۲۹"}
                    </div>
                  </div>
                  <div className="font-extrabold text-xs border border-slate-800 px-2 py-1 rounded">
                    رَساپست
                  </div>
                </div>

                {/* Sender & Order Summary */}
                <div className="grid grid-cols-12 border border-slate-800">
                  <div className="col-span-7 p-2 border-l border-slate-800 space-y-0.5">
                    <div className="font-extrabold">فرستنده (فروشنده): {tenant.name}</div>
                    <div>آدرس: {tenant.senderAddress || "ثبت در تنظیمات فروشگاه"}</div>
                    <div>
                      کد پستی: <span className="font-mono">{tenant.senderPostalCode || "—"}</span> |
                      تلفن: <span className="font-mono">{tenant.senderPhone || "—"}</span>
                    </div>
                  </div>
                  <div className="col-span-5 p-2 space-y-0.5 bg-slate-50">
                    <div>
                      <strong>شناسه سفارش:</strong> #{order.order_number}
                    </div>
                    <div>
                      <strong>نوع پرداخت:</strong> {isCod ? "پس‌کرایه" : "پرداخت آنلاین"}
                    </div>
                    <div className="font-extrabold pt-0.5">
                      {isCod
                        ? `مبلغ قابل دریافت: ${formatToman(order.total_amount)}`
                        : "نیاز به دریافت وجه نیست"}
                    </div>
                  </div>
                </div>

                {/* Receiver & Stamp Boxes */}
                <div className="grid grid-cols-12 border border-slate-800">
                  <div className="col-span-8 p-2 border-l border-slate-800 space-y-1">
                    <div className="font-extrabold text-xs">
                      گیرنده (خریدار): {order.customer_name}
                    </div>
                    <div>
                      استان/شهر: {order.receiver_province || "—"} / {order.receiver_city || "—"}
                    </div>
                    <div>آدرس: {order.receiver_address || "ثبت در سفارش"}</div>
                    <div>
                      کد پستی:{" "}
                      <span className="font-mono font-bold">
                        {order.receiver_postal_code || "—"}
                      </span>{" "}
                      | موبایل: <span className="font-mono">{order.customer_mobile || "—"}</span>
                    </div>
                  </div>
                  <div className="col-span-2 p-1.5 border-l border-slate-800 text-center flex flex-col justify-between text-[9px] text-slate-500">
                    <span>محل مهر فروشگاه</span>
                    <span className="border-t border-dashed pt-1">امضا</span>
                  </div>
                  <div className="col-span-2 p-1.5 text-center flex flex-col justify-between text-[9px] text-slate-500">
                    <span>امضا گیرنده</span>
                    <span>تاریخ تحویل</span>
                  </div>
                </div>

                {/* Return Reasons + Service Details + QR */}
                <div className="grid grid-cols-12 border border-slate-800">
                  <div className="col-span-5 p-1.5 border-l border-slate-800 text-[9px] space-y-1">
                    <div className="font-bold text-center border-b pb-0.5">علت برگشتی</div>
                    <div className="grid grid-cols-2 gap-0.5">
                      <span>□ عدم اطلاع</span>
                      <span>□ نقل مکان</span>
                      <span>□ عدم نقدینگی</span>
                      <span>□ مغایرت فاکتور</span>
                      <span>□ انصراف خرید</span>
                      <span>□ شناخته نشد</span>
                    </div>
                  </div>
                  <div className="col-span-4 p-1.5 border-l border-slate-800 text-[10px] space-y-1">
                    <div className="rounded-full border border-slate-700 px-2 py-0.5 text-center font-bold">
                      {order.shipping_carrier || "پست پیشتاز"}
                    </div>
                    <div className="flex justify-between">
                      <span>سایز بسته:</span>
                      <span className="font-bold">{order.package_size || "سایز ۳"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>کرایه پستی:</span>
                      <span className="font-bold">{formatToman(order.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>وزن مرسوله:</span>
                      <span className="font-bold">{order.total_weight_grams || 500} گرم</span>
                    </div>
                  </div>
                  <div className="col-span-3 p-1.5 flex flex-col items-center justify-center gap-1">
                    <img src={qrSvg} alt="QR" className="h-16 w-16" />
                    <span className="text-[9px] text-slate-500">
                      {formatFaDate(order.created_at).split("،")[0]}
                    </span>
                  </div>
                </div>

                {/* Linear Barcode Code-128 */}
                <div className="border border-slate-800 p-2 text-center space-y-1">
                  <img src={barcodeSvg} alt={barcodeVal} className="h-11 w-full max-w-xs mx-auto" />
                  <div className="font-mono font-extrabold text-xs tracking-widest">
                    {barcodeVal}
                  </div>
                  <div className="font-extrabold text-xs border-t border-slate-200 pt-1">
                    مقصد: {order.receiver_province || "ایران"} - {order.receiver_city || "مقصد مشتری"}
                  </div>
                </div>

                {/* Optional Items list */}
                {showItems && items.length > 0 && (
                  <div className="border-t border-dashed border-slate-500 pt-1.5 text-[10px]">
                    <strong>اقلام داخل بسته:</strong>{" "}
                    {items.map((it: any) => `${it.title} (${it.qty} عدد)`).join(" ، ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// فاکتور رسمی کامل A4/A5 و فیش حرارتی ۸۰ میلی‌متری
export function OfficialInvoicePrintModal({
  order,
  tenant,
  mode,
  onClose,
}: {
  order: any | null;
  tenant: { name: string; senderPhone: string; senderAddress: string };
  mode: "THERMAL" | "A4";
  onClose: () => void;
}) {
  if (!order) return null;
  const items = order.order_items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className={`w-full rounded-2xl bg-white p-6 space-y-4 text-xs shadow-2xl ${
          mode === "THERMAL" ? "max-w-xs" : "max-w-2xl border-2 border-slate-900"
        }`}
      >
        <div className="text-center border-b border-dashed border-slate-400 pb-3">
          <div className="font-extrabold text-base">{tenant.name}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {mode === "THERMAL" ? "فیش فروش فروشگاه" : "فاکتور رسمی فروش کالا"} — شماره #
            {order.order_number}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{formatFaDate(order.created_at)}</div>
        </div>

        <div className="flex justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl">
          <span>
            <strong>مشتری:</strong> {order.customer_name}
          </span>
          <span>
            <strong>پرداخت:</strong> {order.payment_method}
          </span>
        </div>

        <table className="w-full text-right text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-500">
              <th className="py-1.5">نام کالا</th>
              <th className="py-1.5">تعداد</th>
              <th className="py-1.5">فی</th>
              <th className="py-1.5">جمع</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it: any) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="py-1.5 font-semibold">{it.title}</td>
                  <td className="py-1.5">{it.qty}</td>
                  <td className="py-1.5">{formatToman(it.unit_price)}</td>
                  <td className="py-1.5 font-bold">{formatToman(it.qty * it.unit_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-2 text-center text-slate-400">
                  اقلام سفارش #{order.order_number}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="border-t border-dashed border-slate-400 pt-2.5 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>مالیات بر ارزش افزوده:</span>
            <span>{formatToman(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>هزینه ارسال ({order.shipping_carrier}):</span>
            <span>{formatToman(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200">
            <span>جمع کل فاکتور:</span>
            <span>{formatToman(order.total_amount)}</span>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500 border-t pt-2">
          {tenant.senderAddress} — تلفن: {tenant.senderPhone || "—"} | با تشکر از خرید شما
        </div>

        <div className="no-print flex gap-2 pt-1">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-white font-bold cursor-pointer"
          >
            <Printer className="h-4 w-4" /> چاپ
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
