import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
export async function POST(request) {
  try {
    // 1. Read JSON sent by the client
    const data = await request.json();

    const { fullName, email, phone, password } = data;

    // 2. Validate required fields
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        {
          message: "All account fields are required.",
        },
        { status: 400 }
      );
    }

    // 3. Check whether email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // 4. Find CLIENT role
    const clientRole = await prisma.role.findUnique({
      where: {
        name: "CLIENT",
      },
    });

    if (!clientRole) {
      return NextResponse.json(
        {
          message: "CLIENT role not found.",
        },
        { status: 500 }
      );
    }

    // 5. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 6. Create user
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: email,
        phone: phone,
        passwordHash: passwordHash,
        roleId: clientRole.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    // 7. Return successful response
    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Account creation error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}
