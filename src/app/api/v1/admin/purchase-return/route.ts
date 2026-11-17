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
    const variantId = String(body.variantId || "");
    const qty = Number(body.qty || 0);
    const note = String(body.note || "فاکتور برگشت از خرید").trim();

    if (!variantId || qty <= 0) {
      return NextResponse.json({ error: "انتخاب کالا و تعداد معتبر الزامی است" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("record_purchase_return_atomic", {
      p_tenant_id: session.tenantId,
      p_variant_id: variantId,
      p_qty: qty,
      p_note: note,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ثبت برگشت از خرید" },
      { status: 500 }
    );
  }
}
