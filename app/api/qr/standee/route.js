import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getOrCreateBusinessQR } from "@/lib/services/qrService";
import { generateStandeePDF } from "@/lib/qr/generateStandeePDF";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // 1. Authenticate the user.
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to download your standee PDF." },
        { status: 401 },
      );
    }

    const ownerId = Number(session.user.id);

    if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
      return NextResponse.json(
        { error: "Invalid authenticated user." },
        { status: 401 },
      );
    }

    // 2. Parse and validate the request.
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const businessId = Number(body?.businessId);
    const format = body?.format;

    if (!Number.isSafeInteger(businessId) || businessId <= 0) {
      return NextResponse.json(
        { error: "A valid businessId is required." },
        { status: 400 },
      );
    }

    if (!["4x6", "12x12cm"].includes(format)) {
      return NextResponse.json(
        {
          error: 'Invalid format. Choose "4x6" or "12x12cm".',
        },
        { status: 400 },
      );
    }

    // 3. Verify business ownership and active subscription.
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId,
      },
      select: {
        id: true,
        shopName: true,
        subscriptions: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or access denied." },
        { status: 404 },
      );
    }

    if (business.subscriptions.length === 0) {
      return NextResponse.json(
        {
          error:
            "An active subscription is required to download standee templates.",
        },
        { status: 403 },
      );
    }

    // 4. Retrieve or create the business's QR record.
    const qrCode = await getOrCreateBusinessQR(business.id, ownerId);

    // 5. Generate the requested print-ready PDF.
    // The PDF generator creates the QR from the saved destination URL.
    const pdfBytes = await generateStandeePDF(qrCode.destinationUrl, format);


    const filename =
      format === "4x6"
        ? "shryxa-review-standee-4x6-inch.pdf"
        : "shryxa-review-standee-12x12-cm.pdf";

    // 7. Return the PDF as a downloadable response.
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
            "Please configure your Google Review URL before downloading the template.",
        },
        { status: 400 },
      );
    }

    if (error.message === "INVALID_GOOGLE_REVIEW_URL") {
      return NextResponse.json(
        { error: "The saved Google Review URL is invalid." },
        { status: 400 },
      );
    }

    if (error.message === "BUSINESS_NOT_FOUND") {
      return NextResponse.json(
        { error: "Business not found or access denied." },
        { status: 404 },
      );
    }

    console.error("Standee PDF generation error:", error);

    return NextResponse.json(
      {
        error: "Unable to generate the standee PDF. Please try again.",
      },
      { status: 500 },
    );
  }
}
