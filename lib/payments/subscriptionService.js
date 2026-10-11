import prisma from "../prisma.js";
import { getRazorpayClient } from "./razorpay.js";

export async function createSubscription(businessId) {
  const planId = process.env.RAZORPAY_PLAN_ID;

  if (!planId) {
    throw new Error("Razorpay Plan ID is missing.");
  }

  // Confirm the business exists before creating a subscription.
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new Error("Business not found.");
  }

  // Save a local subscription record first.
  const localSubscription = await prisma.subscription.create({
    data: {
      businessId: business.id,
      planName: "MONTHLY",
      amount: 199,
      interval: "MONTHLY",
      provider: "RAZORPAY",
      providerPlanId: planId,
      status: "CREATED",
    },
  });

  try {
    // Create the subscription with Razorpay.
    const razorpay = getRazorpayClient();

    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        businessId: String(business.id),
        localSubscriptionId: String(localSubscription.id),
      },
    });

    // Link the Razorpay subscription to our database record.
    const updatedSubscription = await prisma.subscription.update({
      where: { id: localSubscription.id },
      data: {
        providerSubscriptionId: razorpaySubscription.id,
      },
    });

    return {
      subscriptionId: razorpaySubscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      localSubscriptionId: updatedSubscription.id,
    };
  } catch (error) {
    // Keep a record of the failed creation attempt.
    await prisma.subscription.update({
      where: { id: localSubscription.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
}
