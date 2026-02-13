const StripeEvent = require("../model/stripeEvent");
const { getStripeClient } = require("../lib/libStripe");
const { logger } = require("../utils/logger");
const Transaction = require("../model/transaction");
const User = require("../model/user");

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const updateOrCreateTransaction = async ({
  paymentId,
  stripeObjectType,
  status,
  amount,
  userId,
  method,
}) => {
  if (!paymentId || typeof paymentId !== "string") return;

  const update = {
    status,
    stripeObjectType: stripeObjectType || null,
  };

  if (typeof amount === "number") update.amount = amount;
  if (typeof method === "number") update.method = method;
  if (userId) update.user = userId;

  await Transaction.findOneAndUpdate(
    { paymentId },
    { $set: update, $setOnInsert: { isActive: true } },
    { upsert: true, new: true }
  );
};

const processStripeEvent = async (event) => {
  const type = event.type;
  const obj = event.data && event.data.object;

  // Connected account status updates (Stripe Connect onboarding)
  if (type === "account.updated") {
    const account = obj;
    const accountId = account?.id;
    if (typeof accountId === "string" && accountId.trim().length > 0) {
      const detailsSubmitted = account?.details_submitted === true;
      const chargesEnabled = account?.charges_enabled === true;
      const payoutsEnabled = account?.payouts_enabled === true;

      // Production gating: treat onboarding as complete only when Stripe marks it ready.
      const onboardingComplete = detailsSubmitted && chargesEnabled && payoutsEnabled;

      await User.updateOne(
        { account: accountId },
        {
          $set: {
            stripeOnboardingComplete: onboardingComplete,
          },
        }
      );
    }
    return;
  }

  // Wallet top-ups are PaymentIntents created by createPaymentIntent()
  if (type === "payment_intent.succeeded" || type === "payment_intent.payment_failed") {
    const paymentIntent = obj;
    const status = type === "payment_intent.succeeded" ? "succeeded" : "failed";
    const amount = safeNumber(paymentIntent.amount);
    const metadata = paymentIntent.metadata || {};

    const userId = metadata.userId;
    let user = null;
    if (userId) {
      user = await User.findOne({ _id: userId }).select({ _id: 1 });
    }

    await updateOrCreateTransaction({
      paymentId: paymentIntent.id,
      stripeObjectType: "payment_intent",
      status,
      amount: amount != null ? amount / 100 : undefined,
      userId: user ? user._id : undefined,
    });
    return;
  }

  // Escrow charges are created via stripe.charges.create()
  if (type === "charge.succeeded" || type === "charge.failed" || type === "charge.refunded") {
    const charge = obj;
    const status =
      type === "charge.succeeded"
        ? "succeeded"
        : type === "charge.refunded"
          ? "refunded"
          : "failed";
    const amount = safeNumber(charge.amount);

    await updateOrCreateTransaction({
      paymentId: charge.id,
      stripeObjectType: "charge",
      status,
      amount: amount != null ? amount / 100 : undefined,
    });
    return;
  }

  // Payouts are created via stripe.payouts.create() in createPayout()
  if (type === "payout.paid" || type === "payout.failed" || type === "payout.canceled") {
    const payout = obj;
    const status = type === "payout.paid" ? "paid" : "failed";
    const amount = safeNumber(payout.amount);

    await updateOrCreateTransaction({
      paymentId: payout.id,
      stripeObjectType: "payout",
      status,
      amount: amount != null ? amount / 100 : undefined,
    });
    return;
  }
};

const stripeWebhook = async (req, res) => {
  const stripe = getStripeClient();

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).send("Stripe webhook is not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    logger.warn({ err }, "stripe_webhook_signature_verification_failed");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const existing = await StripeEvent.findOne({ eventId: event.id });
    if (existing) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const stripeEvent = await StripeEvent.create({
      eventId: event.id,
      type: event.type,
      livemode: event.livemode,
      processedAt: new Date(),
    });

    logger.info(
      {
        stripeEventId: event.id,
        type: event.type,
        livemode: event.livemode,
      },
      "stripe_webhook_event"
    );

    await processStripeEvent(event);
    await stripeEvent.updateOne({ processedAt: new Date() });

    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, "stripe_webhook_processing_failed");
    return res.status(500).json({ received: false });
  }
};

module.exports = {
  stripeWebhook,
};
