import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Authenticate the user.
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please log in to access your business." },
        { status: 401 },
      );
    }

    // 2. Get the owner ID from the trusted session.
    const ownerId = Number(session.user.id);

    if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
      return NextResponse.json(
        { error: "Invalid authenticated user." },
        { status: 401 },
      );
    }

    // 3. Fetch only businesses belonging to this user.
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
    // 1. Get the authenticated user's session.
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please log in to create a business." },
        { status: 401 },
      );
    }

    // 2. Get the owner ID from the trusted session.
    const ownerId = Number(session.user.id);

    if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
      return NextResponse.json(
        { message: "Invalid authenticated user." },
        { status: 401 },
      );
    }

    // 3. Read business details from the request.
    const data = await request.json();

    const { shopName, ownerName, phone, address, pinCode, googleReviewUrl } =
      data;

    // 4. Validate required fields.
    if (
      !shopName ||
      !ownerName ||
      !phone ||
      !address ||
      !pinCode ||
      !googleReviewUrl
    ) {
      return NextResponse.json(
        { message: "All business fields are required." },
        { status: 400 },
      );
    }

    // 5. Confirm the authenticated user still exists.
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

    // 6. Create the business under the authenticated user.
    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        shopName,
        ownerName,
        phone,
        address,
        pinCode,
        googleReviewUrl,
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

    if (!/^[6-9]\d{9}$/.test(data.phone.replace(/^\+91/, ""))) {
      return NextResponse.json(
        { error: "Please enter a valid Indian mobile number." },
        { status: 400 },
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(data.googleReviewUrl);
    } catch {
      return NextResponse.json(
        { error: "Please enter a valid Google Review URL." },
        { status: 400 },
      );
    }

    if (
      parsedUrl.protocol !== "https:" ||
      !["google.com", "www.google.com", "maps.google.com"].includes(
        parsedUrl.hostname,
      )
    ) {
      return NextResponse.json(
        {
          error: "Use a valid HTTPS Google Maps or Google Review URL.",
        },
        { status: 400 },
      );
    }

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
