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
    const unitCostRials = Number(body.unitCostToman || 0) * 10;
    const note = String(body.note || "فاکتور خرید کالا").trim();

    if (!variantId || qty <= 0 || unitCostRials < 0) {
      return NextResponse.json(
        { error: "انتخاب کالا، تعداد معتبر و قیمت خرید الزامی است." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("record_purchase_atomic", {
      p_tenant_id: session.tenantId,
      p_variant_id: variantId,
      p_qty: qty,
      p_unit_cost: unitCostRials,
      p_note: note,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ثبت فاکتور خرید" },
      { status: 500 }
    );
  }
}
