import { cookies } from "next/headers";
import { adminCookieName, isValidAdminSession } from "@/lib/admin-auth";

export async function isWorkspaceOwner() {
  const jar = await cookies();
  return isValidAdminSession(jar.get(adminCookieName)?.value);
}
