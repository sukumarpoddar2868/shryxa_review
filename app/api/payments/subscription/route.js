import { auth } from "../../../../auth.js";
import prisma from "../../../../lib/prisma.js";
import { createSubscription } from "../../../../lib/payments/subscriptionService.js";

export async function POST(request) {
  try {
    // Step 1: Verify the user is logged in.
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { message: "Please log in first." },
        { status: 401 },
      );
    }

    // Step 2: Read the business ID from the request.
    const body = await request.json();
    const businessId = Number(body.businessId);
    const ownerId = Number(session.user.id);

    if (
      !Number.isInteger(businessId) ||
      businessId <= 0 ||
      !Number.isInteger(ownerId)
    ) {
      return Response.json(
        { message: "Invalid business or user ID." },
        { status: 400 },
      );
    }

    // Step 3: Verify that this business belongs to the logged-in user.
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: ownerId,
      },
    });

    if (!business) {
      return Response.json(
        { message: "Business not found or access denied." },
        { status: 404 },
      );
    }

    // Step 4: Prevent creating another subscription if one is active.
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        businessId: business.id,
        status: "ACTIVE",
      },
    });

    if (activeSubscription) {
      return Response.json(
        { message: "This business already has an active subscription." },
        { status: 409 },
      );
    }

    // Step 5: Reuse an existing subscription if it is awaiting payment.
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        businessId: business.id,
        status: "CREATED",
        providerSubscriptionId: { not: null },
      },
    });

    if (existingSubscription) {
      return Response.json({
        subscriptionId: existingSubscription.providerSubscriptionId,
        localSubscriptionId: existingSubscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // Step 6: Create a new subscription.
    const subscription = await createSubscription(business.id);

    return Response.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Subscription creation error:", error);

    return Response.json(
      { message: "Unable to create the subscription. Please try again." },
      { status: 500 },
    );
  }
}
