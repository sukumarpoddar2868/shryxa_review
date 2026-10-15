import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  try {
    // Only administrators can access dashboard data.
    const { response } = await requireAdmin();

    if (response) {
      return response;
    }

    const [
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      revenueResult,
      recentBusinesses,
      recentPayments,
    ] = await Promise.all([
      // Total registered businesses
      prisma.business.count(),

      // Businesses whose Business.status is ACTIVE
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),

      // Total client users
      prisma.user.count({
        where: {
          role: {
            name: "CLIENT",
          },
        },
      }),

      // Total successful payments
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
        },
        _sum: {
          amount: true,
        },
      }),

      // Recent businesses with their latest subscription
      prisma.business.findMany({
        take: 5,

        orderBy: [{ createdAt: "desc" }, { id: "desc" }],

        select: {
          id: true,
          shopName: true,
          ownerName: true,
          phone: true,
          createdAt: true,

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

      // Recent payments
      prisma.payment.findMany({
        take: 5,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          createdAt: true,

          business: {
            select: {
              shopName: true,
            },
          },
        },
      }),
    ]);

    // Format businesses using subscription status,
    // NOT Business.status.
    const formattedBusinesses = recentBusinesses.map((business) => ({
      id: business.id,
      shopName: business.shopName,
      ownerName: business.ownerName,
      phone: business.phone,
      createdAt: business.createdAt,

      subscriptionStatus:
        business.subscriptions[0]?.status ?? "NO_SUBSCRIPTION",
    }));

    return NextResponse.json({
      stats: {
        totalBusinesses,
        activeBusinesses,
        totalUsers,
        totalRevenue: Number(revenueResult._sum.amount ?? 0),
      },

      recentBusinesses: formattedBusinesses,
      recentPayments,
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load dashboard data.",
      },
      {
        status: 500,
      },
    );
  }
}
