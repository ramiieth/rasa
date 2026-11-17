"use client";

import { useState } from "react";
import { MessageSquare, Send, Wallet } from "lucide-react";
import { formatToman, formatFaDate } from "@/lib/format";

export function RasaSmsSection({
  templates,
  logs,
  smsBalance,
  onReload,
  onNotify,
}: {
  templates: any[];
  logs: any[];
  smsBalance: number;
  onReload: () => Promise<void>;
  onNotify: (type: "ok" | "err", text: string) => void;
}) {
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [topupToman, setTopupToman] = useState("100000");

  async function saveTemplate(t: any) {
    const bodyText = editing[t.id] ?? t.body;
    const res = await fetch("/api/v1/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_TEMPLATE",
        templateId: t.id,
        body: bodyText,
        isActive: true,
      }),
    });
    if (res.ok) {
      onNotify("ok", `قالب پیامکی «${t.title}» ذخیره شد.`);
      await onReload();
    }
  }

  async function sendSms(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "SEND_SMS", mobile, message }),
    });
    if (res.ok) {
      setMobile("");
      setMessage("");
      onNotify("ok", "پیامک در صف ارسال ثبت شد.");
      await onReload();
    }
  }

  async function topupSms(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "TOPUP_SMS", amountToman: Number(topupToman) }),
    });
    if (res.ok) {
      onNotify("ok", "حساب پیامک با موفقیت شارژ شد.");
      await onReload();
    }
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="grid lg:grid-cols-12 gap-6">
        <form
          onSubmit={topupSms}
          className="lg:col-span-4 rounded-2xl border border-emerald-200 bg-emerald-900 text-white p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-emerald-200 font-bold">
            <Wallet className="h-4 w-4" /> اعتبار سامانه رَسا پیامک
          </div>
          <div className="text-2xl font-extrabold">{formatToman(smsBalance)}</div>
          <div className="flex gap-2">
            <input
              type="number"
              value={topupToman}
              onChange={(e) => setTopupToman(e.target.value)}
              className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-2 font-extrabold text-slate-950 cursor-pointer"
            >
              شارژ پیامک
            </button>
          </div>
        </form>

        <form
          onSubmit={sendSms}
          className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="font-extrabold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" />
            ارسال پیامک فوری به مشتری
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              type="tel"
              required
              dir="ltr"
              placeholder="09123456789"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-left"
            />
            <input
              type="text"
              required
              placeholder="متن پیامک..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="sm:col-span-2 rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" /> ارسال پیامک
          </button>
        </form>
      </div>

      {/* Templates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="font-extrabold text-sm">قالب‌های پیامکی خودکار</div>
        <div className="grid md:grid-cols-3 gap-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="font-bold text-slate-900">{t.title}</div>
              <textarea
                rows={3}
                value={editing[t.id] ?? t.body}
                onChange={(e) => setEditing((prev) => ({ ...prev, [t.id]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 p-2 text-[11px]"
              />
              <button
                onClick={() => saveTemplate(t)}
                className="w-full rounded-lg bg-slate-900 py-1.5 font-bold text-white cursor-pointer"
              >
                ذخیره قالب
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b px-4 py-3 font-bold text-sm">
          گزارش پیامک‌های ارسالی ({logs.length})
        </div>
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">شماره گیرنده</th>
              <th className="p-3">متن پیامک</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">زمان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="p-3 font-mono">{l.mobile}</td>
                <td className="p-3">{l.message}</td>
                <td className="p-3 font-bold text-emerald-700">{l.status}</td>
                <td className="p-3 text-slate-400">{formatFaDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
