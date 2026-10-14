import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminDashboard from "./AdminDashboard";

export default async function Page() {
  // 1. Get the current session.
  const session = await auth();

  // 2. Require authentication.
  if (!session?.user) {
    redirect("/login");
  }

  // 3. Require the ADMIN role.
  if (session.user.role !== "ADMIN") {
    redirect("/client/dashboard");
  }

  // 4. Only an authenticated admin reaches this point.
  return <AdminDashboard />;
}
