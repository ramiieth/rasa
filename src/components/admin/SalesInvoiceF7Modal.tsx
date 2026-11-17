"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, UserPlus, Barcode } from "lucide-react";
import { formatToman } from "@/lib/format";

interface RowItem {
  barcode: string;
  variantId: string;
  title: string;
  qty: number;
  unitPriceRials: number;
}

export function SalesInvoiceF7Modal({
  open,
  onClose,
  variants,
  customers,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  variants: any[];
  customers: any[];
  onSaved: (msg: string) => Promise<void>;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState("مشتری عمومی");
  const [customerMobile, setCustomerMobile] = useState("09110000000");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");

  const [barcodeInput, setBarcodeInput] = useState("");
  const [rows, setRows] = useState<RowItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "POS_CARD" | "CARD_TO_CARD">("CASH");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => barcodeRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open) return null;

  function addVariantToRows(v: any) {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products;
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.variantId === v.id);
      if (idx >= 0) {
        return prev.map((r, i) => (i === idx ? { ...r, qty: r.qty + 1 } : r));
      }
      return [
        ...prev,
        {
          barcode: v.barcode || v.sku,
          variantId: v.id,
          title: prod?.title || v.sku,
          qty: 1,
          unitPriceRials: Number(v.retail_price),
        },
      ];
    });
  }

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = barcodeInput.trim().toLowerCase();
    if (!code) return;
    const found = variants.find(
      (v) =>
        (v.barcode && v.barcode.toLowerCase() === code) ||
        (v.sku && v.sku.toLowerCase() === code)
    );
    if (!found) {
      setError(`کالایی با بارکد یا کد «${barcodeInput}» یافت نشد.`);
      return;
    }
    setError("");
    addVariantToRows(found);
    setBarcodeInput("");
    barcodeRef.current?.focus();
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: newCustName, mobile: newCustMobile }),
    });
    if (res.ok) {
      setSelectedCustomer(newCustName);
      setCustomerMobile(newCustMobile);
      setNewCustName("");
      setNewCustMobile("");
      setShowAddCustomer(false);
    }
  }

  const totalRials = rows.reduce((s, r) => s + r.qty * r.unitPriceRials, 0);

  async function handleFinalizeSale() {
    if (rows.length === 0) {
      setError("حداقل یک کالا به فاکتور اضافه کنید.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/v1/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "POS",
          paymentMethod,
          customerName: selectedCustomer,
          customerMobile,
          shippingCostToman: 0,
          idempotencyKey: `f7-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          items: rows.map((r) => ({ variant_id: r.variantId, qty: r.qty })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "خطا در ثبت فاکتور فروش");
        setSaving(false);
        return;
      }
      setRows([]);
      await onSaved(
        `فاکتور فروش حضوری #${json.order.order_number} ثبت و موجودی از کاردکس کسر شد.`
      );
      onClose();
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden text-xs">
        <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-4">
          <div className="font-extrabold text-sm">
            افزودن فاکتور فروش سریع (کلید میانبر F7)
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Customer Selection */}
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex-1 min-w-48">
              <label className="block font-bold text-slate-600 mb-1">انتخاب مشتری</label>
              <select
                value={`${selectedCustomer}|${customerMobile}`}
                onChange={(e) => {
                  const [name, mob] = e.target.value.split("|");
                  setSelectedCustomer(name);
                  setCustomerMobile(mob);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold"
              >
                <option value="مشتری عمومی|09110000000">عمومی — 09110000000</option>
                {customers.map((c) => (
                  <option key={c.id} value={`${c.full_name}|${c.mobile}`}>
                    {c.full_name} — {c.mobile}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCustomer(!showAddCustomer)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              افزودن مشتری
            </button>
          </div>

          {showAddCustomer && (
            <form
              onSubmit={handleCreateCustomer}
              className="flex flex-wrap gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl"
            >
              <input
                type="text"
                required
                placeholder="نام مشتری"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5"
              />
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="09123456789"
                value={newCustMobile}
                onChange={(e) => setNewCustMobile(e.target.value)}
                className="w-40 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-left"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-1.5 font-bold text-white cursor-pointer"
              >
                ذخیره مشتری
              </button>
            </form>
          )}

          {/* Barcode Scan Row + Manual Select */}
          <form onSubmit={handleBarcodeSubmit} className="grid sm:grid-cols-12 gap-2">
            <div className="sm:col-span-5 relative">
              <Barcode className="h-4 w-4 text-indigo-600 absolute right-3 top-2.5" />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="اسکن بارکد (مثلاً 1250) + Enter..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full rounded-xl border-2 border-indigo-500 bg-indigo-50/30 pr-9 pl-3 py-2 font-mono font-bold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-5">
              <select
                defaultValue=""
                onChange={(e) => {
                  const v = variants.find((item) => item.id === e.target.value);
                  if (v) addVariantToRows(v);
                  e.target.value = "";
                  barcodeRef.current?.focus();
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              >
                <option value="">انتخاب دستی کالا از لیست...</option>
                {variants.map((v) => {
                  const p = Array.isArray(v.products) ? v.products[0] : v.products;
                  return (
                    <option key={v.id} value={v.id}>
                      {p?.title} ({v.barcode || v.sku})
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              type="submit"
              className="sm:col-span-2 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" /> افزودن
            </button>
          </form>

          {/* Items Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">ردیف</th>
                  <th className="p-3">بارکد</th>
                  <th className="p-3">کالا</th>
                  <th className="p-3">تعداد</th>
                  <th className="p-3">مبلغ واحد</th>
                  <th className="p-3">جمع ردیف</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      بارکد کالا را اسکن کنید یا از لیست بالا انتخاب نمایید
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.variantId}>
                      <td className="p-3 font-bold">{i + 1}</td>
                      <td className="p-3 font-mono text-slate-500">{r.barcode}</td>
                      <td className="p-3 font-bold">{r.title}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={1}
                          value={r.qty}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((row) =>
                                row.variantId === r.variantId
                                  ? { ...row, qty: Math.max(1, Number(e.target.value)) }
                                  : row
                              )
                            )
                          }
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center font-bold"
                        />
                      </td>
                      <td className="p-3">{formatToman(r.unitPriceRials)}</td>
                      <td className="p-3 font-extrabold text-indigo-700">
                        {formatToman(r.qty * r.unitPriceRials)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() =>
                            setRows((prev) => prev.filter((row) => row.variantId !== r.variantId))
                          }
                          className="text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">نوع پرداخت</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-bold"
              >
                <option value="CASH">صندوق نقدی فروشگاه</option>
                <option value="POS_CARD">دستگاه کارتخوان (پوز)</option>
                <option value="CARD_TO_CARD">کارت‌به‌کارت بانکی</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">توضیحات فاکتور</label>
              <input
                type="text"
                placeholder="توضیحات فاکتور را وارد کنید..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-rose-700 font-bold">{error}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="text-sm font-extrabold">
              مبلغ کل فاکتور: <span className="text-indigo-700">{formatToman(totalRials)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={saving || rows.length === 0}
                onClick={handleFinalizeSale}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "در حال ثبت..." : "ثبت نهایی فاکتور و کسر انبار"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
