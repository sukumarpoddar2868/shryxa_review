import "dotenv/config";
import { getRazorpayClient } from "../lib/payments/razorpay.js";

const subscriptionIds = [
  "sub_TmzPgfZ5k8LEuo",
  "sub_Tmw3etcLTHAR52",
  "sub_TmSuzLaVItHl8x",
];

const razorpay = getRazorpayClient();

for (const id of subscriptionIds) {
  try {
    const subscription = await razorpay.subscriptions.fetch(id);

    console.log({
      id: subscription.id,
      status: subscription.status,
      plan_id: subscription.plan_id,
      start_at: subscription.start_at,
      charge_at: subscription.charge_at,
    });
  } catch (error) {
    console.error(`Could not fetch ${id}:`, error.message);
  }
}
