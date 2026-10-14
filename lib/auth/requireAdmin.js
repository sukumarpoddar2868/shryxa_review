import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();

  // Check authentication
  if (!session?.user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  // Check authorization
  if (session.user.role !== "ADMIN") {
    return {
      response: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }

  return {
    session,
    response: null,
  };
}
