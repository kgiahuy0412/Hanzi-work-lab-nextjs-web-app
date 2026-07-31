import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth-session.ts";

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?error=required");
  if (user.role !== "admin") redirect("/admin/login?error=forbidden");
  return user;
}
