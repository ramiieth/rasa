import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdmin();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug")
      .eq("slug", slug.toLowerCase())
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "فروشگاه یافت نشد" }, { status: 404 });
    }

    const { data: variants, count } = await supabase
      .from("product_variants")
      .select(
        "id, sku, retail_price, products!inner(title, slug, category_name, image_url, is_active), stock_balances(physical_qty)",
        { count: "exact" }
      )
      .eq("tenant_id", tenant.id)
      .eq("products.is_active", true)
      .range(offset, offset + limit - 1);

    const origin = url.origin;
    const products = (variants || []).map((v) => {
      const prod = Array.isArray(v.products) ? v.products[0] : v.products;
      const stock = Array.isArray(v.stock_balances)
        ? v.stock_balances[0]
        : v.stock_balances;
      const qty = Number(stock?.physical_qty || 0);
      const priceToman = Math.round(Number(v.retail_price || 0) / 10);

      return {
        page_unique: v.id,
        page_url: `${origin}/s/${tenant.slug}?sku=${encodeURIComponent(v.sku)}`,
        title: prod?.title || v.sku,
        price: String(priceToman),
        availability: qty > 0 ? "instock" : "outofstock",
        category_name: prod?.category_name || "عمومی",
        image_link: prod?.image_url || "",
      };
    });

    return NextResponse.json({
      count: count || products.length,
      products,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در تولید فید ترب" },
      { status: 500 }
    );
  }
}
