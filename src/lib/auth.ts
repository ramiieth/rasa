import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rasa_session";

export interface RasaSession {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  email: string;
  role: string;
  exp: number;
}

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "rasa-dev-fallback-secret-change-in-prod"
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
}

export async function createSessionCookie(
  data: Omit<RasaSession, "exp">
): Promise<void> {
  const session: RasaSession = {
    ...data,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url"
  );
  const sig = signPayload(payloadB64);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payloadB64}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<RasaSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payloadB64, sig] = raw.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = signPayload(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as RasaSession;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
