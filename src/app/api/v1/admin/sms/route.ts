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

    if (action === "UPDATE_TEMPLATE") {
      const { error } = await supabase
        .from("sms_templates")
        .update({
          body: String(body.body || ""),
          is_active: Boolean(body.isActive),
        })
        .eq("id", String(body.templateId))
        .eq("tenant_id", session.tenantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "SEND_SMS") {
      const mobile = String(body.mobile || "").trim();
      const message = String(body.message || "").trim();
      if (!mobile || !message) {
        return NextResponse.json({ error: "شماره موبایل و متن پیامک الزامی است" }, { status: 400 });
      }
      await supabase.from("sms_logs").insert({
        tenant_id: session.tenantId,
        mobile,
        message,
        status: "SENT",
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "TOPUP_SMS") {
      const amountRials = Number(body.amountToman || 0) * 10;
      const { data: tenant } = await supabase
        .from("tenants")
        .select("sms_balance")
        .eq("id", session.tenantId)
        .single();
      const next = Number(tenant?.sms_balance || 0) + amountRials;
      await supabase
        .from("tenants")
        .update({ sms_balance: next })
        .eq("id", session.tenantId);
      return NextResponse.json({ ok: true, smsBalance: next });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ماژول پیامک" },
      { status: 500 }
    );
  }
}
