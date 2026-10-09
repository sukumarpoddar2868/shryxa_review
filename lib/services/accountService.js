export async function createAccount(accountData) {
  const response = await fetch("/api/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(accountData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Account creation failed.");
  }

  return data;
}
