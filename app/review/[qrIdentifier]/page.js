import prisma from "../../../lib/prisma";
import ReviewPage from "./ReviewPage";

export default async function Page({ params }) {
  const { qrIdentifier } = await params;

  let googleReviewUrl = null;
  let qrIsValid = false;

  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        qrIdentifier,
      },
      include: {
        business: {
          select: {
            googleReviewUrl: true,
          },
        },
      },
    });

    if (qrCode && qrCode.status === "ACTIVE") {
      qrIsValid = true;
      googleReviewUrl = qrCode.business.googleReviewUrl;
    }
  } catch (error) {
    console.error("Failed to load QR review page:", error);
  }

  if (!qrIsValid || !googleReviewUrl) {
    return (
      <main style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Review page unavailable</h2>
        <p>This QR code is invalid or inactive. Please contact the business.</p>
      </main>
    );
  }

  return (
    <ReviewPage qrIdentifier={qrIdentifier} googleReviewUrl={googleReviewUrl} />
  );
}
