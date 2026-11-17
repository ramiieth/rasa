import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generatePostalBarcode } from "@/lib/shipping-calculator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const channel = body.channel === "ONLINE" ? "ONLINE" : "POS";
    const paymentMethod = String(body.paymentMethod || "POS_CARD");
    const bnplProvider = body.bnplProvider ? String(body.bnplProvider) : null;
    const bnplInstallments = Number(body.bnplInstallments || (paymentMethod === "BNPL" ? 4 : 1));
    const customerName = String(body.customerName || "مشتری حضوری").trim();
    const customerMobile = String(body.customerMobile || "").trim();
    const shippingCarrier = String(body.shippingCarrier || "PISHTAZ");
    const receiverPostalCode = String(body.receiverPostalCode || "").trim();
    const receiverAddress = String(body.receiverAddress || "").trim();
    const shippingCostRials = Number(
      body.shippingCostRials ?? Number(body.shippingCostToman || 0) * 10
    );
    const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey) : null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "سبد خرید خالی است." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let tenantId = "";

    if (channel === "POS") {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "لطفاً وارد پنل شوید." }, { status: 401 });
      }
      tenantId = session.tenantId;
    } else {
      const tenantSlug = String(body.tenantSlug || "").trim().toLowerCase();
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();
      if (!tenant) {
        return NextResponse.json({ error: "فروشگاه یافت نشد." }, { status: 404 });
      }
      tenantId = tenant.id;
    }

    const autoBarcode =
      channel === "ONLINE"
        ? generatePostalBarcode(shippingCarrier, Math.floor(1000 + Math.random() * 9000))
        : null;

    const { data, error } = await supabase.rpc("finalize_sale_atomic", {
      p_tenant_id: tenantId,
      p_channel: channel,
      p_payment_method: paymentMethod,
      p_customer_name: customerName,
      p_customer_mobile: customerMobile,
      p_shipping_cost: shippingCostRials,
      p_items: items,
      p_idempotency_key: idempotencyKey,
      p_shipping_carrier: shippingCarrier,
      p_receiver_postal_code: receiverPostalCode || null,
      p_receiver_address: receiverAddress || null,
      p_tracking_barcode: autoBarcode,
      p_bnpl_provider: bnplProvider,
      p_bnpl_installments: bnplInstallments,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ثبت سفارش" },
      { status: 500 }
    );
  }
}
