import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BusinessesPage from "./BusinessesPage";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/client/dashboard");
  }

  return <BusinessesPage />;
}
