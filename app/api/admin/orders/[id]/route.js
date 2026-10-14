import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET: Fetch complete details of a specific order
export async function GET(request, { params }) {
  try {
    const { response } = await requireAdmin();

    if (response) {
      return response;
    }

    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        product: true,
        business: {
          select: {
            id: true,
            shopName: true,
            ownerName: true,
            phone: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            provider: true,
            providerPaymentId: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Admin order details API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch order details." },
      { status: 500 },
    );
  }
}

// PATCH: Mark an order as shipped
export async function PATCH(request, { params }) {
  try {
    const { response } = await requireAdmin();

    if (response) {
      return response;
    }

    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        fulfilmentStatus: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (
      existingOrder.status !== "PAID" ||
      existingOrder.fulfilmentStatus !== "PENDING"
    ) {
      return NextResponse.json(
        {
          error: "Only paid orders awaiting shipment can be marked as shipped.",
        },
        { status: 409 },
      );
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        fulfilmentStatus: "SHIPPED",
        shippedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        fulfilmentStatus: true,
        shippedAt: true,
      },
    });

    return NextResponse.json({
      message: "Order marked as shipped successfully.",
      order,
    });
  } catch (error) {
    console.error("Admin update order API error:", error);

    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 },
    );
  }
}
