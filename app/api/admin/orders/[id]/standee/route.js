import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getOrCreateBusinessQR } from "@/lib/services/qrService";
import { generateStandeePDF } from "@/lib/qr/generateStandeePDF";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    // 1. Verify administrator access.
    const { response } = await requireAdmin();

    if (response) {
      return response;
    }

    // 2. Validate the order ID.
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    // 3. Validate the requested standee format.
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const { format } = body ?? {};

    if (!["4x6", "12x12cm"].includes(format)) {
      return NextResponse.json(
        { error: 'Choose either "4x6" or "12x12cm".' },
        { status: 400 },
      );
    }

    // 4. Retrieve the order and its associated business.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        business: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status !== "PAID") {
      return NextResponse.json(
        { error: "Only paid orders can have standee PDFs generated." },
        { status: 409 },
      );
    }

    if (!order.business) {
      return NextResponse.json(
        { error: "No business is associated with this order." },
        { status: 404 },
      );
    }

    // 5. Get or create the QR code for this order's business.
    const qrCode = await getOrCreateBusinessQR(
      order.business.id,
      order.business.ownerId,
    );

    // 6. Generate the selected print-ready PDF.
    const pdfBytes = await generateStandeePDF(qrCode.destinationUrl, format);

    const filename =
      format === "4x6"
        ? `order-${order.id}-standee-4x6-inch.pdf`
        : `order-${order.id}-standee-12x12-cm.pdf`;

    // 7. Return the PDF as a download.
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error.message === "GOOGLE_REVIEW_URL_MISSING") {
      return NextResponse.json(
        {
          error:
            "Configure the business's Google Review URL before generating its standee.",
        },
        { status: 400 },
      );
    }

    if (error.message === "INVALID_GOOGLE_REVIEW_URL") {
      return NextResponse.json(
        { error: "The business's Google Review URL is invalid." },
        { status: 400 },
      );
    }

    if (error.message === "BUSINESS_NOT_FOUND") {
      return NextResponse.json(
        { error: "The associated business could not be found." },
        { status: 404 },
      );
    }

    console.error("Admin standee PDF generation error:", error);

    return NextResponse.json(
      { error: "Unable to generate the standee PDF. Please try again." },
      { status: 500 },
    );
  }
}
