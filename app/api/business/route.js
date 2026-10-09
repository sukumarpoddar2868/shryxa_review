import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();

    const {
      ownerId,
      shopName,
      ownerName,
      phone,
      address,
      pinCode,
      googleReviewUrl,
    } = data;

    // Validate required fields
    if (
      !ownerId ||
      !shopName ||
      !ownerName ||
      !phone ||
      !address ||
      !pinCode ||
      !googleReviewUrl
    ) {
      return NextResponse.json(
        { message: "All business fields are required." },
        { status: 400 }
      );
    }

    // Check whether the user exists
    const owner = await prisma.user.findUnique({
      where: {
        id: Number(ownerId),
      },
    });

    if (!owner) {
      return NextResponse.json(
        { message: "Account owner not found." },
        { status: 404 }
      );
    }

    // Create business
    const business = await prisma.business.create({
      data: {
        ownerId: Number(ownerId),
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Business creation error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while creating the business.",
      },
      { status: 500 }
    );
  }
}
