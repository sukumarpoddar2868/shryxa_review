import crypto from "crypto";
import prisma from "../../../../../lib/prisma.js";

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  return crypto.timingSafeEqual(expected, received);
}

function unixToDate(timestamp) {
  return timestamp ? new Date(timestamp * 1000) : undefined;
}

export async function POST(request) {
  try {
    // 1. Read the original request body.
    const rawBody = await request.text();

    // 2. Verify that Razorpay sent this webhook.
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is missing.");

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

    // 3. Parse the body only after signature verification.
    const eventData = JSON.parse(rawBody);
    const event = eventData.event;

    const subscriptionEntity = eventData.payload?.subscription?.entity;

    const paymentEntity = eventData.payload?.payment?.entity;

    // Ignore events unrelated to subscriptions.
    if (!subscriptionEntity?.id) {
      return Response.json({ received: true });
    }

    // 4. Find our local subscription.
    const localSubscription = await prisma.subscription.findUnique({
      where: {
        providerSubscriptionId: subscriptionEntity.id,
      },
    });

    // A valid event for an unknown subscription should not be retried
    // indefinitely. Log it for investigation.
    if (!localSubscription) {
      console.warn(
        "Webhook received for an unknown subscription:",
        subscriptionEntity.id,
      );

      return Response.json({ received: true });
    }

    // 5. Update the subscription according to the event.
    const statusMap = {
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

    const newStatus = statusMap[event];

    if (newStatus) {
      const updateData = {
        status: newStatus,
      };

      const currentPeriodStart = unixToDate(subscriptionEntity.current_start);

      const currentPeriodEnd = unixToDate(subscriptionEntity.current_end);

      const nextBillingAt = unixToDate(subscriptionEntity.charge_at);

      const startDate = unixToDate(subscriptionEntity.start_at);

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

    // 6. Record successful or failed billing attempts.
    // Do not treat subscription activation alone as proof that a
    // recurring payment has been captured.
    const shouldRecordPayment =
      (event === "subscription.charged" &&
        paymentEntity?.status === "captured") ||
      (event === "payment.failed" && paymentEntity?.status === "failed");

    if (shouldRecordPayment && paymentEntity?.id) {
      const isCaptured = paymentEntity.status === "captured";

      await prisma.payment.upsert({
        where: {
          providerPaymentId: paymentEntity.id,
        },
        update: {
          status: isCaptured ? "SUCCESS" : "FAILED",
          ...(isCaptured
            ? { paidAt: unixToDate(paymentEntity.created_at) }
            : {}),
        },
        create: {
          businessId: localSubscription.businessId,
          subscriptionId: localSubscription.id,
          provider: "RAZORPAY",
          providerPaymentId: paymentEntity.id,
          amount: paymentEntity.amount / 100,
          currency: paymentEntity.currency || "INR",
          status: isCaptured ? "SUCCESS" : "FAILED",
          ...(isCaptured
            ? { paidAt: unixToDate(paymentEntity.created_at) }
            : {}),
        },
      });
    }

    return Response.json({
      received: true,
      event,
    });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);

    return Response.json(
      { message: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
