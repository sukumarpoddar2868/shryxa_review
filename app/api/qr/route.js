import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getOrCreateBusinessQR } from "@/lib/services/qrService";

export async function POST(request) {
  try {
    // 1. Authenticate the user.
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to access your QR code." },
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

    // 2. Validate the requested business ID.
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

    if (!Number.isSafeInteger(businessId) || businessId <= 0) {
      return NextResponse.json(
        { error: "A valid businessId is required." },
        { status: 400 },
      );
    }

    // 3. Verify that the business belongs to this user.
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId },
      select: {
        id: true,
        shopName: true,
        subscriptions: {
          where: { status: "ACTIVE" },
          select: { id: true, status: true },
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

    // 4. Require an active subscription.
    if (business.subscriptions.length === 0) {
      return NextResponse.json(
        {
          error:
            "An active subscription is required to generate or access a QR code.",
        },
        { status: 403 },
      );
    }

    // 5. Get or create this business's QR record.
    const qrCode = await getOrCreateBusinessQR(business.id, ownerId);

    // 6. Return the QR information.
    const qrImage = await QRCode.toDataURL(qrCode.destinationUrl, {
      errorCorrectionLevel: "H",
      width: 600,
      margin: 4,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json(
      {
        success: true,
        business: {
          id: business.id,
          shopName: business.shopName,
        },
        qrCode: {
          id: qrCode.id,
          businessId: qrCode.businessId,
          qrIdentifier: qrCode.qrIdentifier,
          destinationUrl: qrCode.destinationUrl,
          status: qrCode.status,
          image: qrImage,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error.message === "GOOGLE_REVIEW_URL_MISSING") {
      return NextResponse.json(
        {
          error:
            "Please configure your Google Review URL before generating a QR code.",
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

    console.error("QR API error:", error);

    return NextResponse.json(
      { error: "Unable to generate the QR code. Please try again." },
      { status: 500 },
    );
  }
}
