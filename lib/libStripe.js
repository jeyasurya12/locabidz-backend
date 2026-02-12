let stripeClient;

const getStripe = () => {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment (.env) before using Stripe features."
    );
  }

  stripeClient = require("stripe")(key);
  return stripeClient;
};

const getStripeClient = () => getStripe();

const createConnectAccount = async ({ user }) => {
  const stripe = getStripe();
  const country = process.env.STRIPE_COUNTRY || "US";
  const accountType = process.env.STRIPE_CONNECT_ACCOUNT_TYPE || "express";

  const base = {
    type: accountType,
    country,
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      url: process.env.STRIPE_BUSINESS_URL,
    },
    metadata: {
      userId: String(user._id),
    },
  };

  const account = await stripe.accounts.create(base);

  return account;
};

const updateConnectAccount = async ({ user }) => {
  const stripe = getStripe();
  const account = await stripe.accounts.update(user.account, {
    external_account: {
      object: "bank_account",
      country: user.bankAccount.country,
      currency: user.bankAccount.currency,
      account_number: user.bankAccount.accountNumber,
      routing_number: user.bankAccount.routingNumber,
    },
  });
  return account;
};

const createPaymentIntent = async ({
  account,
  amount,
  idempotencyKey,
  metadata,
}) => {
  const stripe = getStripe();
  const hasDestination = typeof account === "string" && account.trim().length > 0;
  const paymentIntent = await stripe.paymentIntents.create(
    {
      payment_method_types: ["card"],
      amount,
      currency: "usd",
      ...(hasDestination
        ? {
            on_behalf_of: account,
            transfer_data: {
              destination: account,
            },
          }
        : {}),
      metadata: metadata && typeof metadata === "object" ? metadata : undefined,
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );
  return paymentIntent;
};

const createPayout = async ({ account, amount, fee, idempotencyKey }) => {
  const stripe = getStripe();

  const hasAccount = typeof account === "string" && account.trim().length > 0;
  if (!hasAccount) {
    throw new Error(
      "Stripe payout requires a non-empty connected account. Please connect Stripe account."
    );
  }

  const payout = await stripe.payouts.create(
    {
      amount,
      currency: "usd",
      description: "Payout to specific bank account",
    },
    Object.assign(
      {
        stripeAccount: account.trim(),
      },
      idempotencyKey ? { idempotencyKey } : {}
    )
  );
  return payout;
};

const getBalance = async ({ account }) => {
  const stripe = getStripe();
  const balance = await stripe.balance.retrieve({
    stripeAccount: account,
  });
  return balance;
};

const getAccount = async ({ account }) => {
  const stripe = getStripe();
  const retrivedAcc = await stripe.account.retrieve(account);
  return retrivedAcc;
};

const getTransfers = async ({ account }) => {
  const stripe = getStripe();
  const transfers = await stripe.transfers.list({
    destination: account,
    limit: 100,
  });
  return transfers;
};

const getPayouts = async ({ account }) => {
  const stripe = getStripe();
  const payouts = await stripe.payouts.list(
    {
      limit: 100,
    },
    {
      stripeAccount: account,
    }
  );
  return payouts;
};

const getCharges = async ({ account }) => {
  const stripe = getStripe();
  const charges = await stripe.charges.list(
    {
      limit: 100,
    },
    {
      stripeAccount: account,
    }
  );
  return charges;
};

const stripeCreateCharge = async ({
  amount,
  currency = "usd",
  source,
  transfer_group = "{ORDER16}",
  idempotencyKey,
}) => {
  const stripe = getStripe();
  const charge = await stripe.charges.create(
    {
      source,
      amount,
      currency,
      description: "Amount in escrow.",
      transfer_group,
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return charge;
};

const stripeTransfer = async ({
  amount,
  currency = "usd",
  source,
  destination,
  transfer_group = "{ORDER16}",
  idempotencyKey,
}) => {
  const stripe = getStripe();
  // await stripe.refunds.create({ charge: source })

  const hasDestination =
    typeof destination === "string" && destination.trim().length > 0;
  if (!hasDestination) {
    throw new Error(
      "Stripe transfer requires a non-empty destination account."
    );
  }

  const transfer = await stripe.transfers.create(
    {
      amount,
      currency,
      source_transaction: source,
      destination: destination.trim(),
      transfer_group,
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  return transfer;
};

module.exports = {
  getStripeClient,
  createConnectAccount,
  createPaymentIntent,
  getBalance,
  getAccount,
  stripeCreateCharge,
  stripeTransfer,
  getTransfers,
  getCharges,
  createPayout,
  getPayouts,
  updateConnectAccount,
};
