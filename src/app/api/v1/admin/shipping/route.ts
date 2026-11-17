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
        .update({
          tracking_barcode: barcode,
          shipping_carrier: carrier,
          is_suspended: false,
          package_size: body.packageSize || "کارتن سایز ۳",
        })
        .eq("id", orderId)
        .eq("tenant_id", session.tenantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, barcode });
    }

    if (action === "BATCH_ISSUE_BARCODE") {
      const orderIds: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
      const packageSize = String(body.packageSize || "کارتن سایز ۳");
      const carrier = String(body.carrier || "PISHTAZ");

      for (let i = 0; i < orderIds.length; i++) {
        const barcode = generatePostalBarcode(carrier, 1000 + i + Math.floor(Math.random() * 900));
        await supabase
          .from("orders")
          .update({
            tracking_barcode: barcode,
            shipping_carrier: carrier,
            package_size: packageSize,
            is_suspended: false,
          })
          .eq("id", orderIds[i])
          .eq("tenant_id", session.tenantId);
      }

      return NextResponse.json({ ok: true, count: orderIds.length });
    }

    if (action === "MANUAL_PARCEL") {
      const customerName = String(body.customerName || "").trim();
      const customerMobile = String(body.customerMobile || "").trim();
      const weightGrams = Number(body.weightGrams || 500);
      const postalCode = String(body.postalCode || "").trim();
      const province = String(body.province || "").trim();
      const city = String(body.city || "").trim();
      const address = String(body.address || "").trim();
      const packageSize = String(body.packageSize || "کارتن سایز ۳");
      const carrier = String(body.carrier || "PISHTAZ");
      const shippingCostRials = Number(body.shippingCostToman || 55000) * 10;
      const sendSms = Boolean(body.sendSms);

      if (!customerName || !customerMobile || !address) {
        return NextResponse.json(
          { error: "نام گیرنده، موبایل و آدرس کامل الزامی است." },
          { status: 400 }
        );
      }

      const { data: maxRow } = await supabase
        .from("orders")
        .select("order_number")
        .eq("tenant_id", session.tenantId)
        .order("order_number", { ascending: false })
        .limit(1)
        .single();

      const nextNum = Number(maxRow?.order_number || 1000) + 1;
      const barcode = generatePostalBarcode(carrier, nextNum);

      const { error } = await supabase.from("orders").insert({
        tenant_id: session.tenantId,
        order_number: nextNum,
        channel: "MANUAL_PARCEL",
        payment_method: "ONLINE_GATEWAY",
        customer_name: customerName,
        customer_mobile: customerMobile,
        shipping_carrier: carrier,
        shipping_status: "PENDING_PACK",
        tracking_barcode: barcode,
        package_size: packageSize,
        receiver_province: province,
        receiver_city: city,
        receiver_postal_code: postalCode,
        receiver_address: address,
        total_weight_grams: weightGrams,
        shipping_cost: shippingCostRials,
        total_amount: Number(body.parcelValueToman || 0) * 10,
      });

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      if (sendSms && customerMobile.length >= 10) {
        await supabase.from("sms_logs").insert({
          tenant_id: session.tenantId,
          mobile: customerMobile,
          message: `مرسوله پستی شما با شماره #${nextNum} ثبت شد. کد رهگیری: ${barcode}`,
          status: "SENT",
        });
      }

      return NextResponse.json({ ok: true, orderNumber: nextNum, barcode });
    }

    if (action === "INCREMENT_PRINT") {
      const orderIds: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
      for (const id of orderIds) {
        const { data: row } = await supabase
          .from("orders")
          .select("print_count")
          .eq("id", id)
          .eq("tenant_id", session.tenantId)
          .single();
        await supabase
          .from("orders")
          .update({ print_count: Number(row?.print_count || 0) + 1 })
          .eq("id", id)
          .eq("tenant_id", session.tenantId);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "TOGGLE_SUSPEND") {
      const { error } = await supabase
        .from("orders")
        .update({ is_suspended: Boolean(body.isSuspended) })
        .eq("id", String(body.orderId))
        .eq("tenant_id", session.tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "TOGGLE_CHECK") {
      const { error } = await supabase
        .from("orders")
        .update({ is_checked: Boolean(body.isChecked) })
        .eq("id", String(body.orderId))
        .eq("tenant_id", session.tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "UPDATE_SHIPPING_STATUS") {
      const { error } = await supabase
        .from("orders")
        .update({ shipping_status: String(body.shippingStatus || "PENDING_PACK") })
        .eq("id", String(body.orderId))
        .eq("tenant_id", session.tenantId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "BATCH_STATUS") {
      const orderIds: string[] = Array.isArray(body.orderIds) ? body.orderIds : [];
      const shippingStatus = String(body.shippingStatus || "HANDED_TO_CARRIER");
      for (const id of orderIds) {
        await supabase
          .from("orders")
          .update({ shipping_status: shippingStatus })
          .eq("id", id)
          .eq("tenant_id", session.tenantId);
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
