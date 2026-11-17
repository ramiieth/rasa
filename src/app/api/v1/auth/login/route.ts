import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!slug || !email || !password) {
      return NextResponse.json(
        { error: "شناسه فروشگاه، ایمیل و رمز عبور الزامی است." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, name")
      .eq("slug", slug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "فروشگاه یافت نشد." }, { status: 404 });
    }

    const { data: user } = await supabase
      .from("tenant_users")
      .select("id, email, password_hash, role")
      .eq("tenant_id", tenant.id)
      .eq("email", email)
      .single();

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور نادرست است." },
        { status: 401 }
      );
    }

    await createSessionCookie({
      userId: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ ok: true, slug: tenant.slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ورود به سیستم" },
      { status: 500 }
    );
  }
}
