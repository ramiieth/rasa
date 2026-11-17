import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = String(url.searchParams.get("slug") || "").trim().toLowerCase();
    const code = String(url.searchParams.get("code") || "").trim();

    if (!slug || !code) {
      return NextResponse.json(
        { error: "شناسه فروشگاه و شماره سفارش یا بارکد الزامی است" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "فروشگاه یافت نشد" }, { status: 404 });
    }

    let query = supabase
      .from("orders")
      .select(
        "order_number, status, shipping_carrier, shipping_status, tracking_barcode, customer_name, total_amount, payment_method, bnpl_provider, created_at"
      )
      .eq("tenant_id", tenant.id);

    if (/^\d{1,8}$/.test(code)) {
      query = query.eq("order_number", Number(code));
    } else {
      query = query.eq("tracking_barcode", code);
    }

    const { data: order } = await query.single();

    if (!order) {
      return NextResponse.json(
        { error: "سفارشی با این شماره یا بارکد یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant: tenant.name, order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در پیگیری مرسوله" },
      { status: 500 }
    );
  }
}
