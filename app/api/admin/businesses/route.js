import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(request) {
  try {
    // Only administrators can access this API.
    const { response } = await requireAdmin();

    if (response) {
      return response;
    }

    const { searchParams } = new URL(request.url);

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);

    const parsedLimit = Number.parseInt(searchParams.get("limit") || "10", 10);

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 50)
        : 10;

    const skip = (page - 1) * limit;

    // Fetch only the businesses needed for this page.
    const [businesses, totalRecords] = await Promise.all([
      prisma.business.findMany({
        skip,
        take: limit,

        orderBy: [{ createdAt: "desc" }, { id: "desc" }],

        select: {
          id: true,
          shopName: true,
          ownerName: true,
          phone: true,
          createdAt: true,

          // Fetch the most recently created subscription.
          subscriptions: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],

            take: 1,

            select: {
              status: true,
              createdAt: true,
            },
          },
        },
      }),

      prisma.business.count(),
    ]);

    // Expose subscriptionStatus separately from Business.status.
    const formattedBusinesses = businesses.map((business) => ({
      id: business.id,
      shopName: business.shopName,
      ownerName: business.ownerName,
      phone: business.phone,
      createdAt: business.createdAt,

      subscriptionStatus:
        business.subscriptions[0]?.status ?? "NO_SUBSCRIPTION",
    }));

    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      businesses: formattedBusinesses,

      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Admin businesses API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch businesses.",
      },
      {
        status: 500,
      },
    );
  }
}
