import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const ALLOWED_GOOGLE_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
]);

/**
 * Validate supported Google Maps / Google Review URLs.
 * Returns the original URL with surrounding whitespace removed.
 * Does not resolve short links or rewrite URLs.
 */
function validateGoogleReviewUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return {
      valid: false,
      error: "Google Review URL is required.",
    };
  }

  const originalUrl = value.trim();

  try {
    const parsedUrl = new URL(originalUrl);

    if (
      parsedUrl.protocol !== "https:" ||
      !ALLOWED_GOOGLE_HOSTS.has(parsedUrl.hostname) ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.port
    ) {
      return {
        valid: false,
        error:
          "Use a valid HTTPS Google Maps or Google Review URL, including maps.app.goo.gl short links.",
      };
    }

    return {
      valid: true,
      url: originalUrl,
    };
  } catch {
    return {
      valid: false,
      error: "Please enter a valid Google Review URL.",
    };
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to access your business." },
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

    const businesses = await prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        phone: true,
        address: true,
        pinCode: true,
        status: true,
        googleReviewUrl: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            planName: true,
            amount: true,
            currency: true,
            status: true,
            startDate: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            nextBillingAt: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, businesses }, { status: 200 });
  } catch (error) {
    console.error("Fetch businesses error:", error);

    return NextResponse.json(
      { error: "Unable to fetch your businesses." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please log in to create a business." },
        { status: 401 },
      );
    }

    const ownerId = Number(session.user.id);

    if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
      return NextResponse.json(
        { message: "Invalid authenticated user." },
        { status: 401 },
      );
    }

    let data;

    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    const { shopName, ownerName, phone, address, pinCode, googleReviewUrl } =
      data ?? {};

    if (
      typeof shopName !== "string" ||
      !shopName.trim() ||
      typeof ownerName !== "string" ||
      !ownerName.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      typeof pinCode !== "string" ||
      !pinCode.trim() ||
      typeof googleReviewUrl !== "string" ||
      !googleReviewUrl.trim()
    ) {
      return NextResponse.json(
        { message: "All business fields are required." },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(pinCode.trim())) {
      return NextResponse.json(
        { message: "PIN code must contain exactly 6 digits." },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.trim().replace(/^\+91/, "");

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { message: "Please enter a valid Indian mobile number." },
        { status: 400 },
      );
    }

    const urlValidation = validateGoogleReviewUrl(googleReviewUrl);

    if (!urlValidation.valid) {
      return NextResponse.json(
        { message: urlValidation.error },
        { status: 400 },
      );
    }

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { message: "Account owner not found." },
        { status: 404 },
      );
    }

    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        pinCode: pinCode.trim(),

        // Preserve the supplied URL; do not expand short links.
        googleReviewUrl: urlValidation.url,
      },
    });

    return NextResponse.json(
      {
        message: "Business created successfully.",
        business,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Business creation error:", error);

    return NextResponse.json(
      { message: "Something went wrong while creating the business." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to update your business." },
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

    const fields = [
      "shopName",
      "ownerName",
      "phone",
      "address",
      "pinCode",
      "googleReviewUrl",
    ];

    const data = {};

    for (const field of fields) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return NextResponse.json(
          { error: `${field} is required.` },
          { status: 400 },
        );
      }

      data[field] = body[field].trim();
    }

    if (!/^\d{6}$/.test(data.pinCode)) {
      return NextResponse.json(
        { error: "PIN code must contain exactly 6 digits." },
        { status: 400 },
      );
    }

    const normalizedPhone = data.phone.replace(/^\+91/, "");

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid Indian mobile number." },
        { status: 400 },
      );
    }

    const urlValidation = validateGoogleReviewUrl(data.googleReviewUrl);

    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    // Store the customer's original URL.
    data.googleReviewUrl = urlValidation.url;

    const existingBusiness = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId,
      },
      select: {
        id: true,
      },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Business not found or access denied." },
        { status: 404 },
      );
    }

    const business = await prisma.business.update({
      where: {
        id: businessId,
      },
      data,
      select: {
        id: true,
        shopName: true,
        ownerName: true,
        phone: true,
        address: true,
        pinCode: true,
        googleReviewUrl: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Business details updated successfully.",
        business,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update business error:", error);

    return NextResponse.json(
      { error: "Unable to update business details." },
      { status: 500 },
    );
  }
}
