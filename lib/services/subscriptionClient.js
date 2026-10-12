export async function createSubscriptionRequest(
  businessId,
  { includeStandee = false, delivery = null } = {},
) {
  const response = await fetch("/api/payments/subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businessId,
      includeStandee,
      delivery: includeStandee ? delivery : null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to create subscription.");
  }

  return data;
}
