import { cookies } from "next/headers";
import { ShieldAlert } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";
import { ADMIN_COOKIE, isValidAdminSession } from "@/app/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await isValidAdminSession(token))) {
    return <main className="admin-denied"><div><ShieldAlert /><h1>Administrator sign in</h1><p>This review dashboard is restricted to the Samarthya administrator.</p><AdminLogin /><a href="/">Return to Samarthya</a></div></main>;
  }
  return <AdminDashboard email="Administrator" />;
}
