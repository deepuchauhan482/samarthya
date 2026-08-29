export const ADMIN_COOKIE = "samarthya_admin";
const SESSION_MESSAGE = "samarthya-admin-session-v1";

function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length >= 12 ? value : null;
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function sessionToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(SESSION_MESSAGE)));
  return btoa(String.fromCharCode(...signature)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const configured = adminPassword();
  if (!configured || candidate.length > 256) return false;
  return constantTimeEqual(await sha256(candidate), await sha256(configured));
}

export async function createAdminSession(): Promise<string | null> {
  const configured = adminPassword();
  return configured ? sessionToken(configured) : null;
}

export async function isValidAdminSession(token?: string | null): Promise<boolean> {
  const configured = adminPassword();
  if (!configured || !token) return false;
  return constantTimeEqual(await sha256(token), await sha256(await sessionToken(configured)));
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
  return isValidAdminSession(token ? decodeURIComponent(token) : null);
}
