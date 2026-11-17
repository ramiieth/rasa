import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSessionCookie, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const slug = String(body.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !slug || slug.length < 3 || !email || password.length < 6) {
      return NextResponse.json(
        { error: "لطفاً نام فروشگاه، شناسه انگلیسی (حداقل ۳ کاراکتر)، ایمیل و رمز عبور (حداقل ۶ کاراکتر) را کامل وارد کنید." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const passwordHash = hashPassword(password);

    const { data, error } = await supabase.rpc("provision_rasa_tenant", {
      p_name: name,
      p_slug: slug,
      p_email: email,
      p_password_hash: passwordHash,
    });

    if (error) {
      const msg = error.message.includes("duplicate")
        ? "این شناسه فروشگاه قبلاً ثبت شده است. شناسه دیگری انتخاب کنید."
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { data: userRow } = await supabase
      .from("tenant_users")
      .select("id, role")
      .eq("tenant_id", data.tenant_id)
      .eq("email", email)
      .single();

    await createSessionCookie({
      userId: userRow?.id || data.tenant_id,
      tenantId: data.tenant_id,
      tenantSlug: data.slug,
      tenantName: name,
      email,
      role: userRow?.role || "OWNER",
    });

    return NextResponse.json({ ok: true, slug: data.slug, tenantId: data.tenant_id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای سرور در ساخت فروشگاه" },
      { status: 500 }
    );
  }
}
