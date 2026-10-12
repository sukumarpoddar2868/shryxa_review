import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";

/**
 * Get or create the QR code for a business.
 *
 * QR destination:
 * /review/[qrIdentifier]
 *
 * The business's Google Review URL remains stored
 * separately in Business.googleReviewUrl.
 */
export async function getOrCreateBusinessQR(businessId, ownerId) {
  if (
    !Number.isSafeInteger(businessId) ||
    businessId <= 0 ||
    !Number.isSafeInteger(ownerId) ||
    ownerId <= 0
  ) {
    throw new Error("Invalid business or owner ID.");
  }

  const appUrl = process.env.NEXTAUTH_URL;

  if (!appUrl) {
    throw new Error("NEXTAUTH_URL is not configured.");
  }

  // Verify that this business belongs to the authenticated owner.
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      ownerId,
    },
    select: {
      id: true,
      googleReviewUrl: true,
      qrCodes: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!business) {
    throw new Error("BUSINESS_NOT_FOUND");
  }

  // Validate the saved Google Review URL.
  const googleReviewUrl = business.googleReviewUrl?.trim();

  if (!googleReviewUrl) {
    throw new Error("GOOGLE_REVIEW_URL_MISSING");
  }

  try {
    const parsedGoogleUrl = new URL(googleReviewUrl);

    if (
      parsedGoogleUrl.protocol !== "https:" ||
      !["google.com", "www.google.com", "maps.google.com"].includes(
        parsedGoogleUrl.hostname,
      )
    ) {
      throw new Error("Invalid Google Review URL");
    }
  } catch {
    throw new Error("INVALID_GOOGLE_REVIEW_URL");
  }

  // The QR must lead to Shryxa's review page.
  const existingQR = business.qrCodes[0];

  if (existingQR) {
    const expectedDestination = new URL(
      `/review/${encodeURIComponent(existingQR.qrIdentifier)}`,
      appUrl,
    ).toString();

    // Correct outdated destinations without changing the identifier.
    if (existingQR.destinationUrl !== expectedDestination) {
      return prisma.qRCode.update({
        where: {
          id: existingQR.id,
        },
        data: {
          destinationUrl: expectedDestination,
        },
      });
    }

    return existingQR;
  }

  // Create a unique identifier for this business's review page.
  const qrIdentifier = randomUUID();

  const destinationUrl = new URL(
    `/review/${encodeURIComponent(qrIdentifier)}`,
    appUrl,
  ).toString();

  return prisma.qRCode.create({
    data: {
      businessId: business.id,
      qrIdentifier,
      destinationUrl,
      status: "ACTIVE",
    },
  });
}
