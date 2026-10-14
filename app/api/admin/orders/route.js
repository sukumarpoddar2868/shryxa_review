import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  try {
    // Verify administrator access
    const { response } = await requireAdmin();

    if (response) {
      return response;
    }

    // Fetch paid orders awaiting shipment
    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        fulfilmentStatus: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        currency: true,
        status: true,
        fulfilmentStatus: true,
        recipientName: true,
        recipientPhone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pinCode: true,
        country: true,
        createdAt: true,
        product: {
          select: {
            name: true,
          },
        },
        business: {
          select: {
            shopName: true,
            ownerName: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch pending orders." },
      { status: 500 },
    );
  }
}
