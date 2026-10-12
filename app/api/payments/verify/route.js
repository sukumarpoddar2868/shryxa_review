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

    // 2. Validate the checkout response.
    const body = await request.json();

    const subscriptionId = body.razorpay_subscription_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      typeof subscriptionId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      !subscriptionId ||
      !paymentId ||
      !signature
    ) {
      return Response.json(
        { message: "Missing payment verification details." },
        { status: 400 },
      );
    }

    // 3. Verify the Razorpay checkout signature.
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

    // 4. Find the local subscription.
    const localSubscription = await prisma.subscription.findUnique({
      where: { providerSubscriptionId: subscriptionId },
    });

    if (!localSubscription) {
      return Response.json(
        { message: "Subscription not found." },
        { status: 404 },
      );
    }

    // 5. Verify that the logged-in user owns the business.
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

    // 6. Fetch authoritative payment information from Razorpay.
    const razorpay = getRazorpayClient();

    const [remoteSubscription, remotePayment] = await Promise.all([
      razorpay.subscriptions.fetch(subscriptionId),
      razorpay.payments.fetch(paymentId),
    ]);

    if (
      remoteSubscription.id !== subscriptionId ||
      remoteSubscription.plan_id !== localSubscription.providerPlanId
    ) {
      return Response.json(
        { message: "Subscription details do not match." },
        { status: 400 },
      );
    }

    if (
      remotePayment.id !== paymentId ||
      remotePayment.subscription_id !== subscriptionId
    ) {
      return Response.json(
        { message: "Payment is not associated with this subscription." },
        { status: 400 },
      );
    }

    if (!["authorized", "captured"].includes(remotePayment.status)) {
      return Response.json(
        {
          message: "Payment has not been authorized or captured.",
          paymentStatus: remotePayment.status,
        },
        { status: 400 },
      );
    }

    // 7. Validate currency and expected payment amount.
    if (
      remotePayment.currency !== "INR" ||
      !Number.isSafeInteger(remotePayment.amount) ||
      remotePayment.amount <= 0
    ) {
      return Response.json(
        { message: "Invalid payment amount or currency." },
        { status: 400 },
      );
    }

    const subscriptionAmountPaise = Math.round(
      Number(localSubscription.amount) * 100,
    );

    let standeeOrder = null;
    let isCombinedInitialPayment = false;

    const standeeOrderIdValue =
      remoteSubscription.notes?.standeeOrderId;

    if (standeeOrderIdValue) {
      const standeeOrderId = Number(standeeOrderIdValue);

      if (
        !Number.isSafeInteger(standeeOrderId) ||
        standeeOrderId <= 0
      ) {
        return Response.json(
          { message: "Invalid standee order reference." },
          { status: 400 },
        );
      }

      standeeOrder = await prisma.order.findFirst({
        where: {
          id: standeeOrderId,
          businessId: localSubscription.businessId,
        },
      });

      if (!standeeOrder) {
        return Response.json(
          { message: "Standee order not found." },
          { status: 404 },
        );
      }

      const standeeAmountPaise = Math.round(
        Number(standeeOrder.totalAmount) * 100,
      );

      const expectedCombinedAmount =
        subscriptionAmountPaise + standeeAmountPaise;

      isCombinedInitialPayment =
        standeeAmountPaise === 49900 &&
        remotePayment.amount === expectedCombinedAmount;

      if (!isCombinedInitialPayment) {
        return Response.json(
          {
            message:
              "The payment does not match the expected subscription and standee total.",
          },
          { status: 400 },
        );
      }
    } else if (remotePayment.amount !== subscriptionAmountPaise) {
      return Response.json(
        {
          message: "The payment does not match the subscription amount.",
        },
        { status: 400 },
      );
    }

    // 8. Do not associate an existing Razorpay payment with
    // a different business or subscription.
    const existingPayment = await prisma.payment.findUnique({
      where: { providerPaymentId: paymentId },
    });

    if (
      existingPayment &&
      (
        existingPayment.businessId !== localSubscription.businessId ||
        existingPayment.subscriptionId !== localSubscription.id
      )
    ) {
      console.error("Payment association mismatch:", paymentId);

      return Response.json(
        { message: "This payment is already associated with another record." },
        { status: 409 },
      );
    }

    // 9. Record captured payments transactionally.
    if (remotePayment.status === "captured") {
      const paidAt = remotePayment.created_at
        ? new Date(remotePayment.created_at * 1000)
        : new Date();

      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.upsert({
          where: { providerPaymentId: paymentId },

          update: {
            amount: remotePayment.amount / 100,
            currency: remotePayment.currency,
            status: "SUCCESS",
            paidAt,
            ...(standeeOrder ? { orderId: standeeOrder.id } : {}),
          },

          create: {
            businessId: localSubscription.businessId,
            subscriptionId: localSubscription.id,
            ...(standeeOrder ? { orderId: standeeOrder.id } : {}),
            provider: "RAZORPAY",
            providerPaymentId: paymentId,
            amount: remotePayment.amount / 100,
            currency: remotePayment.currency,
            status: "SUCCESS",
            paidAt,
          },
        });

        // Protect an already-associated payment from unexpected changes.
        if (
          payment.businessId !== localSubscription.businessId ||
          payment.subscriptionId !== localSubscription.id
        ) {
          throw new Error("Payment association mismatch.");
        }

        // Mark the standee paid only after a captured combined payment.
        if (standeeOrder && isCombinedInitialPayment) {
          const currentOrder = await tx.order.findUnique({
            where: { id: standeeOrder.id },
          });

          if (currentOrder?.status === "PENDING_PAYMENT") {
            await tx.order.update({
              where: { id: standeeOrder.id },
              data: {
                status: "PAID",
                fulfilmentStatus: "PENDING",
              },
            });
          }
        }
      });
    }

    // 10. Update subscription status from Razorpay's current state.
    const statusMap = {
      active: "ACTIVE",
      authenticated: "AUTHENTICATED",
      pending: "PENDING",
      halted: "HALTED",
      cancelled: "CANCELLED",
      completed: "COMPLETED",
      paused: "PAUSED",
    };

    const localStatus = statusMap[remoteSubscription.status];

    if (localStatus) {
      const updateData = { status: localStatus };

      if (remoteSubscription.current_start) {
        updateData.currentPeriodStart = new Date(
          remoteSubscription.current_start * 1000,
        );
      }

      if (remoteSubscription.current_end) {
        updateData.currentPeriodEnd = new Date(
          remoteSubscription.current_end * 1000,
        );
      }

      if (remoteSubscription.charge_at) {
        updateData.nextBillingAt = new Date(
          remoteSubscription.charge_at * 1000,
        );
      }

      await prisma.subscription.update({
        where: { id: localSubscription.id },
        data: updateData,
      });
    }

    return Response.json({
      verified: true,
      status: remoteSubscription.status,
      active: remoteSubscription.status === "active",
      standeePaid:
        Boolean(standeeOrder) &&
        isCombinedInitialPayment &&
        remotePayment.status === "captured",
      message:
        remoteSubscription.status === "active"
          ? "Subscription verified successfully."
          : "Payment verified; subscription activation may still be pending.",
    });
  } catch (error) {
    console.error("Subscription verification error:", error);

    return Response.json(
      { message: "Unable to verify the subscription." },
      { status: 500 },
    );
  }
}
