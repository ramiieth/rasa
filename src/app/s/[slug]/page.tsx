import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import StorefrontClient from "./StorefrontClient";

export const dynamic = "force-dynamic";

export default async function TenantStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug.toLowerCase())
    .single();

  if (!tenant) notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select(
      "id, sku, retail_price, attributes, products!inner(id, title, category_name, image_url, is_active), stock_balances(physical_qty)"
    )
    .eq("tenant_id", tenant.id)
    .eq("products.is_active", true);

  return <StorefrontClient tenant={tenant} variants={variants || []} />;
}
