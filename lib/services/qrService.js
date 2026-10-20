import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";

const ALLOWED_GOOGLE_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
]);

function isValidGoogleReviewUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const parsedUrl = new URL(value.trim());

    return (
      parsedUrl.protocol === "https:" &&
      ALLOWED_GOOGLE_HOSTS.has(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password &&
      !parsedUrl.port
    );
  } catch {
    return false;
  }
}

/**
 * Get or create the QR code for a business.
 *
 * QR destination:
 * /review/[qrIdentifier]
 *
 * The original Google Review URL remains stored separately
 * in Business.googleReviewUrl.
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

  const googleReviewUrl = business.googleReviewUrl;

  if (!googleReviewUrl?.trim()) {
    throw new Error("GOOGLE_REVIEW_URL_MISSING");
  }

  if (!isValidGoogleReviewUrl(googleReviewUrl)) {
    throw new Error("INVALID_GOOGLE_REVIEW_URL");
  }

  // QR destination remains Shryxa's review page.
  const existingQR = business.qrCodes[0];

  if (existingQR) {
    const expectedDestination = new URL(
      `/review/${encodeURIComponent(existingQR.qrIdentifier)}`,
      appUrl,
    ).toString();

    // Correct an outdated destination without changing the identifier.
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
