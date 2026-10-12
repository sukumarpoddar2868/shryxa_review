import { auth } from "../../../../auth.js";
import prisma from "../../../../lib/prisma.js";
import { getRazorpayClient } from "../../../../lib/payments/razorpay.js";
import { createSubscription } from "../../../../lib/payments/subscriptionService.js";

const STANDEE_PRODUCT_ID = 1;
const STANDEE_PRICE = 499;
const SUBSCRIPTION_PRICE = 199;

function normalizePhone(phone) {
  return phone.replace(/^\+91/, "");
}

function sameDelivery(order, delivery) {
  return (
    order.recipientName === delivery.recipientName &&
    normalizePhone(order.recipientPhone) ===
      normalizePhone(delivery.recipientPhone) &&
    order.addressLine1 === delivery.addressLine1 &&
    order.addressLine2 === delivery.addressLine2 &&
    order.city === delivery.city &&
    order.state === delivery.state &&
    order.pinCode === delivery.pinCode &&
    order.country === delivery.country
  );
}

function deliveryFromBody(body) {
  return {
    recipientName: body.delivery?.recipientName?.trim(),
    recipientPhone: body.delivery?.recipientPhone?.trim(),
    addressLine1: body.delivery?.addressLine1?.trim(),
    addressLine2: body.delivery?.addressLine2?.trim() || null,
    city: body.delivery?.city?.trim(),
    state: body.delivery?.state?.trim(),
    pinCode: body.delivery?.standeePinCode?.trim(),
    country: body.delivery?.country?.trim(),
  };
}

async function findReusableCheckout(businessId, orderId = null) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      businessId,
      status: {
        in: ["CREATED", "AUTHENTICATED"],
      },
      providerSubscriptionId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const razorpay = getRazorpayClient();

  for (const localSubscription of subscriptions) {
    try {
      const remote = await razorpay.subscriptions.fetch(
        localSubscription.providerSubscriptionId,
      );

      if (
        remote.id !== localSubscription.providerSubscriptionId ||
        remote.plan_id !== localSubscription.providerPlanId
      ) {
        continue;
      }

      const remoteOrderId = remote.notes?.standeeOrderId
        ? Number(remote.notes.standeeOrderId)
        : null;

      if (orderId !== remoteOrderId) {
        continue;
      }

      // Reuse only a checkout that is still awaiting authorization.
      if (remote.status !== "created") {
        continue;
      }

      return {
        subscriptionId: remote.id,
        localSubscriptionId: localSubscription.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        standeeOrderId: remoteOrderId,
        initialAmount: orderId ? 698 : 199,
        recurringAmount: SUBSCRIPTION_PRICE,
      };
    } catch (error) {
      console.error(
        "Unable to check existing Razorpay subscription:",
        localSubscription.providerSubscriptionId,
        error,
      );
    }
  }

  return null;
}

export async function POST(request) {
  let newlyCreatedOrderId = null;

  try {
    // 1. Authenticate the user.
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { message: "Please log in first." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const businessId = Number(body.businessId);
    const ownerId = Number(session.user.id);
    const includeStandee = body.includeStandee === true;

    if (
      !Number.isSafeInteger(businessId) ||
      businessId <= 0 ||
      !Number.isSafeInteger(ownerId) ||
      ownerId <= 0
    ) {
      return Response.json(
        { message: "Invalid business or user ID." },
        { status: 400 },
      );
    }

    // 2. Verify business ownership.
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId,
      },
    });

    if (!business) {
      return Response.json(
        { message: "Business not found or access denied." },
        { status: 404 },
      );
    }

    // 3. Validate optional delivery details.
    let delivery = null;

    if (includeStandee) {
      delivery = deliveryFromBody(body);

      const requiredFields = [
        "recipientName",
        "recipientPhone",
        "addressLine1",
        "city",
        "state",
        "pinCode",
        "country",
      ];

      for (const field of requiredFields) {
        if (!delivery[field]) {
          return Response.json(
            { message: `Missing standee delivery field: ${field}.` },
            { status: 400 },
          );
        }
      }

      if (!/^\d{6}$/.test(delivery.pinCode)) {
        return Response.json(
          { message: "Please provide a valid 6-digit PIN code." },
          { status: 400 },
        );
      }

      if (!/^[6-9]\d{9}$/.test(normalizePhone(delivery.recipientPhone))) {
        return Response.json(
          { message: "Please provide a valid 10-digit Indian phone number." },
          { status: 400 },
        );
      }
    }

    // 4. Prevent duplicate purchases for an already-active subscription.
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        businessId,
        status: "ACTIVE",
      },
    });

    if (activeSubscription) {
      return Response.json(
        { message: "This business already has an active subscription." },
        { status: 409 },
      );
    }

    // 5. Prevent another checkout while an existing standee order
    // has already been paid.
    if (includeStandee) {
      const paidOrder = await prisma.order.findFirst({
        where: {
          businessId,
          productId: STANDEE_PRODUCT_ID,
          status: "PAID",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (paidOrder) {
        return Response.json(
          {
            message:
              "A standee order has already been paid for this business. Please contact support if you need another.",
          },
          { status: 409 },
        );
      }
    }

    // 6. Subscription-only flow: reuse a valid pending checkout.
    if (!includeStandee) {
      const reusable = await findReusableCheckout(businessId, null);

      if (reusable) {
        return Response.json(reusable);
      }
    }

    let standeeOrderId = null;

    // 7. Standee flow: find a matching pending order before creating one.
    if (includeStandee) {
      const product = await prisma.product.findFirst({
        where: {
          id: STANDEE_PRODUCT_ID,
          name: "Shryxa Review Standee",
          isActive: true,
        },
      });

      if (!product || Number(product.price) !== STANDEE_PRICE) {
        return Response.json(
          { message: "The standee product is unavailable." },
          { status: 500 },
        );
      }

      const pendingOrders = await prisma.order.findMany({
        where: {
          businessId,
          productId: product.id,
          status: "PENDING_PAYMENT",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      const matchingOrder = pendingOrders.find((order) =>
        sameDelivery(order, delivery),
      );

      if (matchingOrder) {
        standeeOrderId = matchingOrder.id;

        // Reuse only if Razorpay still has the corresponding
        // checkout awaiting authorization.
        const reusable = await findReusableCheckout(businessId, standeeOrderId);

        if (reusable) {
          return Response.json(reusable);
        }
      } else {
        // 8. No matching pending order exists, so create one.
        const order = await prisma.order.create({
          data: {
            businessId,
            productId: product.id,
            quantity: 1,
            unitPrice: product.price,
            totalAmount: product.price,
            currency: product.currency,
            status: "PENDING_PAYMENT",
            fulfilmentStatus: "PENDING",
            recipientName: delivery.recipientName,
            recipientPhone: delivery.recipientPhone,
            addressLine1: delivery.addressLine1,
            addressLine2: delivery.addressLine2,
            city: delivery.city,
            state: delivery.state,
            pinCode: delivery.pinCode,
            country: delivery.country,
          },
        });

        standeeOrderId = order.id;
        newlyCreatedOrderId = order.id;
      }
    }

    // 9. Create a new checkout associated with the selected order.
    const subscription = await createSubscription(businessId, {
      standeeOrderId,
    });

    return Response.json(
      {
        ...subscription,
        standeeOrderId,
        initialAmount: includeStandee
          ? SUBSCRIPTION_PRICE + STANDEE_PRICE
          : SUBSCRIPTION_PRICE,
        recurringAmount: SUBSCRIPTION_PRICE,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Subscription creation error:", error);

    // Only mark an order failed if this request created it.
    if (newlyCreatedOrderId !== null) {
      try {
        await prisma.order.updateMany({
          where: {
            id: newlyCreatedOrderId,
            status: "PENDING_PAYMENT",
          },
          data: {
            status: "FAILED",
            fulfilmentStatus: "CANCELLED",
          },
        });
      } catch (orderError) {
        console.error("Unable to update failed standee order:", orderError);
      }
    }

    return Response.json(
      { message: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { message: "Please log in first." },
        { status: 401 },
      );
    }

    const ownerId = Number(session.user.id);

    if (!Number.isSafeInteger(ownerId) || ownerId <= 0) {
      return Response.json(
        { message: "Invalid authenticated user." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedBusinessId = searchParams.get("businessId");

    let businessId;

    if (requestedBusinessId !== null) {
      businessId = Number(requestedBusinessId);

      if (!Number.isSafeInteger(businessId) || businessId <= 0) {
        return Response.json(
          { message: "Invalid business ID." },
          { status: 400 },
        );
      }
    }

    const business = await prisma.business.findFirst({
      where: {
        ownerId,
        ...(businessId !== undefined ? { id: businessId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        shopName: true,
        subscriptions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            planName: true,
            amount: true,
            currency: true,
            interval: true,
            status: true,
            startDate: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            nextBillingAt: true,
            cancelAtPeriodEnd: true,
            cancelledAt: true,
            endedAt: true,
            createdAt: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!business) {
      return Response.json(
        { message: "Business not found or access denied." },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      business: {
        id: business.id,
        shopName: business.shopName,
      },
      subscription: business.subscriptions[0] ?? null,
      payments: business.payments,
    });
  } catch (error) {
    console.error("Fetch subscription status error:", error);

    return Response.json(
      { message: "Unable to fetch subscription details." },
      { status: 500 },
    );
  }
}
