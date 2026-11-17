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
    const title = String(body.title || "").trim();
    const categoryName = String(body.categoryName || "عمومی").trim();
    const sku = String(body.sku || "").trim().toUpperCase();
    const barcode = String(body.barcode || "").trim();
    const retailPriceRials = Number(body.retailPriceToman || 0) * 10;
    const initialQty = Number(body.initialQty || 0);
    const unitCostRials = Number(body.unitCostToman || 0) * 10;
    const imageUrl = String(
      body.imageUrl ||
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"
    ).trim();

    if (!title || !sku || retailPriceRials <= 0) {
      return NextResponse.json(
        { error: "نام محصول، کد SKU و قیمت فروش الزامی است." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const slug = `${sku.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .insert({
        tenant_id: session.tenantId,
        title,
        slug,
        category_name: categoryName,
        image_url: imageUrl,
      })
      .select("id")
      .single();

    if (prodErr || !product) {
      return NextResponse.json(
        { error: prodErr?.message || "خطا در ثبت محصول" },
        { status: 400 }
      );
    }

    const { data: variant, error: varErr } = await supabase
      .from("product_variants")
      .insert({
        tenant_id: session.tenantId,
        product_id: product.id,
        sku,
        barcode: barcode || sku,
        retail_price: retailPriceRials,
        attributes: body.attributes || {},
      })
      .select("id")
      .single();

    if (varErr || !variant) {
      return NextResponse.json(
        { error: varErr?.message || "خطا در ثبت تنوع کالا" },
        { status: 400 }
      );
    }

    if (initialQty > 0) {
      const { error: purErr } = await supabase.rpc("record_purchase_atomic", {
        p_tenant_id: session.tenantId,
        p_variant_id: variant.id,
        p_qty: initialQty,
        p_unit_cost: unitCostRials > 0 ? unitCostRials : Math.round(retailPriceRials * 0.7),
        p_note: `ثبت موجودی اولیه محصول ${title}`,
      });
      if (purErr) {
        return NextResponse.json({ error: purErr.message }, { status: 400 });
      }
    } else {
      await supabase.from("stock_balances").insert({
        variant_id: variant.id,
        tenant_id: session.tenantId,
        physical_qty: 0,
        avg_unit_cost: 0,
      });
    }

    return NextResponse.json({ ok: true, variantId: variant.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ایجاد محصول" },
      { status: 500 }
    );
  }
}
