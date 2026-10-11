import { auth } from "../../../../auth.js";
import prisma from "../../../../lib/prisma.js";
import { getRazorpayClient } from "../../../../lib/payments/razorpay.js";
import { verifySubscriptionSignature } from "../../../../lib/payments/paymentService.js";

export async function POST(request) {
  try {
    // 1. Authenticate the user.
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { message: "Please log in first." },
        { status: 401 },
      );
    }

    // 2. Read the Checkout response.
    const body = await request.json();

    const subscriptionId = body.razorpay_subscription_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (!subscriptionId || !paymentId || !signature) {
      return Response.json(
        { message: "Missing payment verification details." },
        { status: 400 },
      );
    }

    // 3. Verify the Checkout signature.
    const isValid = verifySubscriptionSignature({
      subscriptionId,
      paymentId,
      signature,
    });

    if (!isValid) {
      return Response.json(
        { message: "Invalid payment signature." },
        { status: 400 },
      );
    }

    // 4. Find the subscription in our database.
    const localSubscription = await prisma.subscription.findUnique({
      where: {
        providerSubscriptionId: subscriptionId,
      },
    });

    if (!localSubscription) {
      return Response.json(
        { message: "Subscription not found." },
        { status: 404 },
      );
    }

    // 5. Confirm that the logged-in user owns the business.
    const business = await prisma.business.findFirst({
      where: {
        id: localSubscription.businessId,
        ownerId: Number(session.user.id),
      },
    });

    if (!business) {
      return Response.json(
        { message: "You cannot access this subscription." },
        { status: 403 },
      );
    }

    // 6. Fetch the subscription directly from Razorpay.
    const razorpay = getRazorpayClient();

    const remoteSubscription =
      await razorpay.subscriptions.fetch(subscriptionId);

    const remotePayment = await razorpay.payments.fetch(paymentId);

    if (remotePayment.id !== paymentId) {
      return Response.json(
        { message: "Payment details do not match." },
        { status: 400 },
      );
    }
    if (!["authorized", "captured"].includes(remotePayment.status)) {
      return Response.json(
        {
          message: "The payment has not been authorized or captured.",
          paymentStatus: remotePayment.status,
        },
        { status: 400 },
      );
    }

    if (remotePayment.status === "captured") {
      await prisma.payment.upsert({
        where: {
          providerPaymentId: paymentId,
        },
        update: {
          status: "SUCCESS",
          paidAt: remotePayment.created_at
            ? new Date(remotePayment.created_at * 1000)
            : new Date(),
        },
        create: {
          businessId: localSubscription.businessId,
          subscriptionId: localSubscription.id,
          provider: "RAZORPAY",
          providerPaymentId: paymentId,
          amount: remotePayment.amount / 100,
          currency: remotePayment.currency || "INR",
          status: "SUCCESS",
          paidAt: remotePayment.created_at
            ? new Date(remotePayment.created_at * 1000)
            : new Date(),
        },
      });
    }

    // Ensure the fetched subscription matches our configured plan.
    if (
      remoteSubscription.id !== subscriptionId ||
      remoteSubscription.plan_id !== localSubscription.providerPlanId
    ) {
      return Response.json(
        { message: "Subscription details do not match." },
        { status: 400 },
      );
    }

    // 7. Record the verified subscription state.
    if (remoteSubscription.status === "active") {
      await prisma.subscription.update({
        where: { id: localSubscription.id },
        data: { status: "ACTIVE" },
      });
    } else if (remoteSubscription.status === "authenticated") {
      await prisma.subscription.update({
        where: { id: localSubscription.id },
        data: { status: "AUTHENTICATED" },
      });
    } else {
      return Response.json({
        verified: true,
        status: remoteSubscription.status,
        message:
          "The Checkout response is verified, but the subscription is not active yet.",
      });
    }

    return Response.json({
      verified: true,
      status: remoteSubscription.status,
      active: remoteSubscription.status === "active",
      message:
        remoteSubscription.status === "active"
          ? "Subscription is active."
          : "Subscription authorization is complete, but activation is pending.",
    });
  } catch (error) {
    console.error("Subscription verification error:", error);

    return Response.json(
      { message: "Unable to verify the subscription." },
      { status: 500 },
    );
  }
}
