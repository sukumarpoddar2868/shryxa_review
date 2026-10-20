import crypto from "crypto";
import prisma from "../../../../../lib/prisma.js";

function verifyWebhookSignature(rawBody, signature, secret) {
  if (
    !rawBody ||
    !signature ||
    !secret ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

function unixToDate(timestamp) {
  if (!timestamp) return undefined;

  const date = new Date(timestamp * 1000);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getSubscriptionStatus(event, subscriptionEntity) {
  const actualStatus = subscriptionEntity?.status?.toLowerCase();

  const statusMap = {
    created: "CREATED",
    authenticated: "ACTIVE",
    active: "ACTIVE",
    pending: "PENDING",
    halted: "HALTED",
    cancelled: "CANCELLED",
    completed: "COMPLETED",
    paused: "PAUSED",
  };

  // Prefer the actual status in Razorpay's subscription entity.
  if (actualStatus && statusMap[actualStatus]) {
    return statusMap[actualStatus];
  }

  // Fallback for events without a usable subscription status.
  const eventStatusMap = {
    "subscription.authenticated": "AUTHENTICATED",
    "subscription.activated": "ACTIVE",
    "subscription.charged": "ACTIVE",
    "subscription.pending": "PENDING",
    "subscription.halted": "HALTED",
    "subscription.cancelled": "CANCELLED",
    "subscription.completed": "COMPLETED",
    "subscription.paused": "PAUSED",
    "subscription.resumed": "ACTIVE",
  };

  return eventStatusMap[event] ?? null;
}

export async function POST(request) {
  try {
    // 1. Verify the signature against the original request body.
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing.");

      return Response.json(
        { message: "Webhook configuration error." },
        { status: 500 },
      );
    }

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return Response.json(
        { message: "Invalid webhook signature." },
        { status: 400 },
      );
    }

    // 2. Parse only after signature verification.
    let eventData;

    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return Response.json(
        { message: "Invalid webhook JSON." },
        { status: 400 },
      );
    }

    const event = eventData.event;
    const subscriptionEntity =
      eventData.payload?.subscription?.entity;
    const paymentEntity = eventData.payload?.payment?.entity;

    // This endpoint handles subscription-related events.
    if (!subscriptionEntity?.id) {
      return Response.json({
        received: true,
        ignored: "No subscription entity.",
      });
    }

    // 3. Find the subscription created by our application.
    const localSubscription = await prisma.subscription.findUnique({
      where: {
        providerSubscriptionId: subscriptionEntity.id,
      },
    });

    if (!localSubscription) {
      console.warn(
        "Unknown Razorpay subscription:",
        subscriptionEntity.id,
      );

      // Valid webhook, but no matching local subscription.
      return Response.json({ received: true });
    }

    // 4. Identify captured and failed payment events.
    const isCaptured =
      paymentEntity?.status === "captured" &&
      Boolean(paymentEntity.id);

    const isFailed =
      event === "payment.failed" &&
      paymentEntity?.status === "failed" &&
      Boolean(paymentEntity.id);

    // 5. Validate payment amount before recording a transaction.
    let standeeOrder = null;
    let isCombinedInitialPayment = false;

    if (isCaptured || isFailed) {
      const subscriptionAmountPaise = Math.round(
        Number(localSubscription.amount) * 100,
      );

      if (
        !Number.isSafeInteger(paymentEntity.amount) ||
        paymentEntity.amount <= 0 ||
        paymentEntity.currency !== "INR"
      ) {
        console.error("Invalid payment amount or currency.", {
          paymentId: paymentEntity.id,
          amount: paymentEntity.amount,
          currency: paymentEntity.currency,
        });

        // Do not mark an unexpected transaction as successful.
        return Response.json({
          received: true,
          paymentRecorded: false,
          reason: "Invalid payment amount or currency.",
        });
      }

      const standeeOrderIdValue =
        subscriptionEntity.notes?.standeeOrderId;

      if (standeeOrderIdValue) {
        const standeeOrderId = Number(standeeOrderIdValue);

        if (
          !Number.isSafeInteger(standeeOrderId) ||
          standeeOrderId <= 0
        ) {
          console.error("Invalid standee order ID in Razorpay notes.");

          return Response.json({ received: true });
        }

        standeeOrder = await prisma.order.findFirst({
          where: {
            id: standeeOrderId,
            businessId: localSubscription.businessId,
          },
        });

        if (!standeeOrder) {
          console.error(
            "Standee order not found:",
            standeeOrderId,
          );

          return Response.json({ received: true });
        }
      }

      const standeeAmountPaise = standeeOrder
        ? Math.round(Number(standeeOrder.totalAmount) * 100)
        : 0;

      const combinedAmountPaise =
        subscriptionAmountPaise + standeeAmountPaise;

      isCombinedInitialPayment =
        isCaptured &&
        Boolean(standeeOrder) &&
        standeeAmountPaise === 49900 &&
        paymentEntity.amount === combinedAmountPaise;

      const validSubscriptionPayment =
        paymentEntity.amount === subscriptionAmountPaise;

      if (
        !validSubscriptionPayment &&
        !isCombinedInitialPayment
      ) {
        console.error("Unexpected Razorpay payment amount.", {
          paymentId: paymentEntity.id,
          actualAmount: paymentEntity.amount,
          expectedSubscriptionAmount: subscriptionAmountPaise,
          expectedCombinedAmount: combinedAmountPaise,
        });

        // Never mark an unexpected amount as a valid payment.
        return Response.json({
          received: true,
          paymentRecorded: false,
          reason: "Unexpected payment amount.",
        });
      }
    }

    // 6. Process the payment and related order atomically.
    if (isCaptured || isFailed) {
      const paidAt = isCaptured
        ? unixToDate(paymentEntity.created_at) || new Date()
        : undefined;

      await prisma.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findUnique({
          where: {
            providerPaymentId: paymentEntity.id,
          },
        });

        // A successful transaction must never be downgraded.
        const alreadySuccessful =
          existingPayment?.status === "SUCCESS";

        if (alreadySuccessful && isFailed) {
          return;
        }

        const paymentStatus = isCaptured
          ? "SUCCESS"
          : "FAILED";

        await tx.payment.upsert({
          where: {
            providerPaymentId: paymentEntity.id,
          },

          update: {
            // Preserve a successful payment if a delayed failure
            // event arrives after it.
            ...(!alreadySuccessful
              ? { status: paymentStatus }
              : {}),

            ...(isCaptured ? { paidAt } : {}),

            ...(isCombinedInitialPayment && standeeOrder
              ? { orderId: standeeOrder.id }
              : {}),
          },

          create: {
            businessId: localSubscription.businessId,
            subscriptionId: localSubscription.id,

            ...(isCombinedInitialPayment && standeeOrder
              ? { orderId: standeeOrder.id }
              : {}),

            provider: "RAZORPAY",
            providerPaymentId: paymentEntity.id,
            amount: paymentEntity.amount / 100,
            currency: paymentEntity.currency,
            status: paymentStatus,

            ...(isCaptured ? { paidAt } : {}),
          },
        });

        // Only the verified, captured combined payment can
        // confirm the standee order.
        if (
          isCombinedInitialPayment &&
          standeeOrder &&
          isCaptured
        ) {
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

    // 7. Update subscription state and billing dates.
    const newStatus = getSubscriptionStatus(event, subscriptionEntity);

    if (newStatus) {
      const updateData = { status: newStatus };

      const currentPeriodStart = unixToDate(
        subscriptionEntity.current_start,
      );

      const currentPeriodEnd = unixToDate(
        subscriptionEntity.current_end,
      );

      const nextBillingAt = unixToDate(
        subscriptionEntity.charge_at,
      );

      const startDate = unixToDate(
        subscriptionEntity.start_at,
      );

      if (currentPeriodStart) {
        updateData.currentPeriodStart = currentPeriodStart;
      }

      if (currentPeriodEnd) {
        updateData.currentPeriodEnd = currentPeriodEnd;
      }

      if (nextBillingAt) {
        updateData.nextBillingAt = nextBillingAt;
      }

      if (startDate) {
        updateData.startDate = startDate;
      }

      await prisma.subscription.update({
        where: { id: localSubscription.id },
        data: updateData,
      });
    }

    return Response.json({
      received: true,
      event,
      paymentRecorded: Boolean(isCaptured || isFailed),
      standeePaid: isCombinedInitialPayment,
    });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);

    // A 500 response lets Razorpay retry transient failures.
    return Response.json(
      { message: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
