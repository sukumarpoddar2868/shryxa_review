import prisma from "../prisma.js";
import { getRazorpayClient } from "./razorpay.js";

export async function createSubscription(
  businessId,
  { standeeOrderId = null } = {},
) {
  const planId = process.env.RAZORPAY_PLAN_ID;

  if (!planId) {
    throw new Error("Razorpay Plan ID is missing.");
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    throw new Error("Business not found.");
  }

  let standeeOrder = null;

  if (standeeOrderId !== null) {
    standeeOrder = await prisma.order.findFirst({
      where: {
        id: standeeOrderId,
        businessId: business.id,
        status: "PENDING_PAYMENT",
      },
    });

    if (!standeeOrder || Number(standeeOrder.totalAmount) !== 499) {
      throw new Error("Invalid standee order.");
    }
  }

  // Create the local record before contacting Razorpay.
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
    const razorpay = getRazorpayClient();

    const subscriptionRequest = {
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        businessId: String(business.id),
        localSubscriptionId: String(localSubscription.id),
        ...(standeeOrder ? { standeeOrderId: String(standeeOrder.id) } : {}),
      },
    };

    if (standeeOrder) {
      subscriptionRequest.addons = [
        {
          item: {
            name: "Shryxa Review Standee",
            amount: 49900,
            currency: "INR",
          },
        },
      ];
    }

    // Create the remote subscription.
    const razorpaySubscription =
      await razorpay.subscriptions.create(subscriptionRequest);

    // Persist the remote ID before returning checkout details.
    await prisma.subscription.update({
      where: { id: localSubscription.id },
      data: {
        providerSubscriptionId: razorpaySubscription.id,
      },
    });

    return {
      subscriptionId: razorpaySubscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      localSubscriptionId: localSubscription.id,
      standeeOrderId: standeeOrder?.id ?? null,
    };
  } catch (error) {
    console.error("Subscription creation failed:", {
      localSubscriptionId: localSubscription.id,
      error,
    });

    // Do not automatically mark the subscription FAILED here.
    // A network timeout or database error could occur after Razorpay
    // successfully created the remote subscription. Keeping the local
    // record CREATED allows us to investigate and reconcile it safely.
    throw error;
  }
}
