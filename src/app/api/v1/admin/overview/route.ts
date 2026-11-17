import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const tenantId = session.tenantId;

    const [tenantRes, variantsRes, cardexRes, ordersRes, journalRes] = await Promise.all([
      supabase
        .from("tenants")
        .select("id, slug, name, shipping_wallet_balance")
        .eq("id", tenantId)
        .single(),
      supabase
        .from("product_variants")
        .select(
          "id, sku, barcode, attributes, retail_price, wholesale_price, weight_grams, reorder_point, products(id, title, slug, category_name, image_url), stock_balances(physical_qty, avg_unit_cost)"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_cardex")
        .select(
          "id, movement_type, qty_delta, unit_cost, balance_after, reference_type, note, created_at, product_variants(sku, products(title))"
        )
        .eq("tenant_id", tenantId)
        .order("id", { ascending: false })
        .limit(40),
      supabase
        .from("orders")
        .select(
          "id, order_number, channel, payment_method, customer_name, customer_mobile, shipping_carrier, tracking_barcode, receiver_postal_code, receiver_address, total_weight_grams, subtotal, tax_amount, shipping_cost, total_amount, total_cogs, created_at"
        )
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("journal_entries")
        .select(
          "id, entry_number, entry_date, description, source_type, journal_lines(debit, credit, chart_of_accounts(code, name))"
        )
        .eq("tenant_id", tenantId)
        .order("entry_number", { ascending: false })
        .limit(25),
    ]);

    const orders = ordersRes.data || [];
    const onlineSales = orders
      .filter((o) => o.channel === "ONLINE")
      .reduce((acc, o) => acc + Number(o.subtotal || 0), 0);
    const posSales = orders
      .filter((o) => o.channel === "POS")
      .reduce((acc, o) => acc + Number(o.subtotal || 0), 0);
    const totalCogs = orders.reduce((acc, o) => acc + Number(o.total_cogs || 0), 0);
    const totalTax = orders.reduce((acc, o) => acc + Number(o.tax_amount || 0), 0);
    const totalShipping = orders.reduce(
      (acc, o) => acc + Number(o.shipping_cost || 0),
      0
    );
    const grossProfit = onlineSales + posSales - totalCogs;

    return NextResponse.json({
      tenant: {
        id: session.tenantId,
        slug: session.tenantSlug,
        name: tenantRes.data?.name || session.tenantName,
        email: session.email,
        shippingWalletBalance: Number(tenantRes.data?.shipping_wallet_balance ?? 5000000),
      },
      variants: variantsRes.data || [],
      cardex: cardexRes.data || [],
      orders,
      journals: journalRes.data || [],
      pnl: {
        onlineSales,
        posSales,
        totalRevenue: onlineSales + posSales,
        totalCogs,
        grossProfit,
        totalTax,
        totalShipping,
        orderCount: orders.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در دریافت گزارش‌ها" },
      { status: 500 }
    );
  }
}
