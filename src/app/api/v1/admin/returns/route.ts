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
    const orderId = String(body.orderId || "");
    if (!orderId) {
      return NextResponse.json({ error: "شناسه سفارش الزامی است" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("process_sales_return_atomic", {
      p_tenant_id: session.tenantId,
      p_order_id: orderId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ثبت مرجوعی سفارش" },
      { status: 500 }
    );
  }
}
