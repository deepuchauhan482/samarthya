import { clearSessionCookie, getSessionUser, revokeSession } from "@/app/user-auth";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  return user ? Response.json({ user }) : Response.json({ user: null }, { status: 401 });
}

export async function DELETE(request: Request) {
  await revokeSession(request);
  const response = Response.json({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookie);
  return response;
}
