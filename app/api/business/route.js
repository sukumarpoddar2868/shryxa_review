import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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
