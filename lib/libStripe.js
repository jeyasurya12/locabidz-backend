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

const createConnectAccount = async ({ user }) => {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "custom",
    country: "US",
    business_type: "individual",
    individual: {
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      dob: {
        day: 1,
        month: 1,
        year: 1901,
      },
      address: {
        line1: "address_full_match",
        city: "Springfield",
        state: "IL",
        postal_code: "62701",
        country: "US",
      },
      ssn_last_4: "0000",
    },
    business_profile: {
      mcc: "5411",
      url: "https://example-business.com",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    tos_acceptance: {
      ip: "192.0.2.1",
      date: Math.floor(Date.now() / 1000),
    },
    external_account: {
      object: "bank_account",
      country: "US",
      currency: "usd",
      account_number: "000123456789",
      routing_number: "110000000",
    },
    settings: {
      payouts: {
        schedule: {
          interval: "manual",
        },
      },
      payments: {
        statement_descriptor: "ExampleBiz",
      },
    },
  });

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

const createPaymentIntent = async ({ account, amount }) => {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    // payment_method:"card",
    payment_method_types: ["card"],
    amount,
    currency: "usd",
    on_behalf_of: account,
    transfer_data: {
      destination: account,
    },
  });
  return paymentIntent;
};

const createPayout = async ({ account, amount, fee }) => {
  const stripe = getStripe();
  const payout = await stripe.payouts.create(
    {
      amount,
      currency: "usd",
      description: "Payout to specific bank account",
    },
    {
      stripeAccount: account,
    }
  );
  await stripe.charges.create({
    amount: fee,
    currency: "usd",
    source: account,
    description: "Withdraw Fee.",
  });
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
}) => {
  const stripe = getStripe();
  const charge = await stripe.charges.create({
    source,
    amount,
    currency,
    description: "Amount in escrow.",
    transfer_group,
  });

  return charge;
};

const stripeTransfer = async ({
  amount,
  currency = "usd",
  source,
  destination,
  transfer_group = "{ORDER16}",
}) => {
  const stripe = getStripe();
  // await stripe.refunds.create({ charge: source })

  const transfer = await stripe.transfers.create({
    amount,
    currency,
    source_transaction: source,
    destination,
    transfer_group,
  });

  return transfer;
};

module.exports = {
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
