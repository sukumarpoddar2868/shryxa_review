import crypto from "crypto";

export function verifySubscriptionSignature({
  subscriptionId,
  paymentId,
  signature,
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (
    !secret ||
    !subscriptionId ||
    !paymentId ||
    !signature ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  return crypto.timingSafeEqual(expected, received);
}
