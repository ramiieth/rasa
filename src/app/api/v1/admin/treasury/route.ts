import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");
    const supabase = getSupabaseAdmin();

    if (action === "ADD_CHEQUE") {
      const { error } = await supabase.from("cheques").insert({
        tenant_id: session.tenantId,
        direction: body.direction === "OUTGOING" ? "OUTGOING" : "INCOMING",
        cheque_number: String(body.chequeNumber || ""),
        sayadi_id: String(body.sayadiId || ""),
        party_name: String(body.partyName || ""),
        amount: Number(body.amountToman || 0) * 10,
        due_date: String(body.dueDate || new Date().toISOString().slice(0, 10)),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "UPDATE_CHEQUE_STATUS") {
      const { error } = await supabase
        .from("cheques")
        .update({ status: String(body.status || "CLEARED") })
        .eq("id", String(body.chequeId))
        .eq("tenant_id", session.tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "ADD_EXPENSE") {
      const { data, error } = await supabase.rpc("record_expense_atomic", {
        p_tenant_id: session.tenantId,
        p_category: String(body.category || "عمومی"),
        p_title: String(body.title || ""),
        p_amount: Number(body.amountToman || 0) * 10,
        p_payment_method: String(body.paymentMethod || "CASH"),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, result: data });
    }

    if (action === "UPDATE_SETTINGS") {
      const { error } = await supabase
        .from("tenants")
        .update({
          sender_phone: String(body.senderPhone || ""),
          sender_postal_code: String(body.senderPostalCode || ""),
          sender_address: String(body.senderAddress || ""),
          bank_card_number: String(body.bankCardNumber || ""),
          enamad_code: String(body.enamadCode || ""),
        })
        .eq("id", session.tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در خزانه‌داری" },
      { status: 500 }
    );
  }
}
