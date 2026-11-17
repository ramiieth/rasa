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
    const fullName = String(body.fullName || "").trim();
    const mobile = String(body.mobile || "").trim();
    const postalCode = String(body.postalCode || "").trim();
    const address = String(body.address || "").trim();
    const notes = String(body.notes || "").trim();

    if (!fullName || !mobile) {
      return NextResponse.json(
        { error: "نام مشتری و شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("customers")
      .upsert(
        {
          tenant_id: session.tenantId,
          full_name: fullName,
          mobile,
          postal_code: postalCode || null,
          address: address || null,
          notes: notes || null,
        },
        { onConflict: "tenant_id,mobile" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, customer: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ثبت مشتری" },
      { status: 500 }
    );
  }
}
