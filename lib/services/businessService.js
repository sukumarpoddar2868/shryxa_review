export async function createBusiness(businessData) {
  const response = await fetch("/api/business", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(businessData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Business creation failed.");
  }

  return data;
}
