import { ADMIN_COOKIE, createAdminSession, verifyAdminPassword } from "@/app/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !(await verifyAdminPassword(body.password))) return Response.json({ error: "Incorrect administrator password." }, { status: 401 });
  const token = await createAdminSession();
  if (!token) return Response.json({ error: "Administrator access is not configured." }, { status: 503 });
  return Response.json({ authenticated: true }, { headers: { "Set-Cookie": `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`, "Cache-Control": "no-store" } });
}

export async function DELETE() {
  return Response.json({ authenticated: false }, { headers: { "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`, "Cache-Control": "no-store" } });
}
