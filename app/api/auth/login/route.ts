import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createUserSession, sessionCookie, verifyPassword } from "@/app/user-auth";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const [account] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
  if (!account || !(await verifyPassword(password, account.passwordHash))) return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  const session = await createUserSession(account.id);
  const { passwordHash: _passwordHash, ...user } = account;
  const response = Response.json({ user });
  response.headers.set("Set-Cookie", sessionCookie(session.token, session.expiresAt));
  return response;
}
