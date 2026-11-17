import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generatePostalBarcode } from "@/lib/shipping-calculator";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body.action || "");
    const supabase = getSupabaseAdmin();

    if (action === "TOPUP_WALLET") {
      const amountRials = Number(body.amountToman || 0) * 10;
      if (amountRials <= 0) {
        return NextResponse.json({ error: "مبلغ شارژ نامعتبر است" }, { status: 400 });
      }
      const { data: tenant } = await supabase
        .from("tenants")
        .select("shipping_wallet_balance")
        .eq("id", session.tenantId)
        .single();

      const nextBalance = Number(tenant?.shipping_wallet_balance || 0) + amountRials;
      await supabase
        .from("tenants")
        .update({ shipping_wallet_balance: nextBalance })
        .eq("id", session.tenantId);

      return NextResponse.json({ ok: true, balance: nextBalance });
    }

    if (action === "ISSUE_BARCODE") {
      const orderId = String(body.orderId || "");
      const carrier = String(body.carrier || "PISHTAZ");
      const orderNumber = Number(body.orderNumber || 1001);
      const barcode = generatePostalBarcode(carrier, orderNumber);

      const { error } = await supabase
        .from("orders")
        .update({ tracking_barcode: barcode, shipping_carrier: carrier })
        .eq("id", orderId)
        .eq("tenant_id", session.tenantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, barcode });
    }

    if (action === "UPDATE_SHIPPING_STATUS") {
      const orderId = String(body.orderId || "");
      const shippingStatus = String(body.shippingStatus || "PENDING_PACK");

      const { error } = await supabase
        .from("orders")
        .update({ shipping_status: shippingStatus })
        .eq("id", orderId)
        .eq("tenant_id", session.tenantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در سرویس پستی" },
      { status: 500 }
    );
  }
}
