"use strict";
const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");
let cachedTransporter;


function getDefaultFromAddress() {
    if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
    if (process.env.MAIL_USERNAME) return process.env.MAIL_USERNAME;
    const mailUrl = process.env.MAIL_URL;
    if (typeof mailUrl !== "string" || mailUrl.length === 0) return;
    try {
        const parsed = new URL(mailUrl);
        if (parsed.username) return decodeURIComponent(parsed.username);
    } catch (err) {
        return;
    }
}

function getDefaultValue() {
    const fromAddress = getDefaultFromAddress();
    return {
        from: fromAddress ? `"Locabidz " <${fromAddress}>` : undefined, // sender address
        to: process.env.MAIL_USERNAME, // list of receivers
        subject: "Locabidz verification email", // Subject line
        text: "Please verify this link to access Locabidz! https://google.com", // plain text body
        html: "<b>Please verify this link to access Locabidz! <link>https://google.com</link></b>", // html body
    };
}

// let cachedTransporter;
let cachedTransportKey;
let cachedVerifyPromise;
let cachedVerifyKey;

const isRetryableMailError = (err) => {
    const code = err && (err.code || err.errno);
    return (
        code === "ETIMEDOUT" ||
        code === "ESOCKET" ||
        code === "ECONNRESET" ||
        code === "EAI_AGAIN" ||
        code === "ECONNREFUSED"
    );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// function getTransporter() {


//     if (process.env.NODE_ENV === "production" && !process.env.MAIL_HOST) {
//     return nodemailer.createTransport({
//         host: "smtp.gmail.com",
//         port: 587,
//         secure: false,
//         auth: {
//             user: "suryamjs1234@gmail.com",
//             pass: "rekv rlxd unbz kpyg",
//         },
//     });
// }

//     const mailUrl = process.env.MAIL_URL;
//     if (typeof mailUrl === "string" && mailUrl.length > 0) {
//         const key = `url|${mailUrl}`;
//         if (cachedTransporter && cachedTransportKey === key) return cachedTransporter;
//         cachedTransportKey = key;
//         cachedVerifyPromise = undefined;
//         cachedVerifyKey = undefined;
//         cachedTransporter = nodemailer.createTransport(mailUrl);
//         return cachedTransporter;
//     }

//     if (!process.env.MAIL_HOST || !process.env.MAIL_PORT || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
//         throw new Error(
//             "Email is not configured. Please set MAIL_URL (recommended) or MAIL_HOST, MAIL_PORT, MAIL_USERNAME, and MAIL_PASSWORD in your environment (.env)."
//         );
//     }

//     const port = Number(process.env.MAIL_PORT);
//     if (!Number.isFinite(port) || port <= 0) {
//         throw new Error("MAIL_PORT must be a valid number.");
//     }

//     const secure = process.env.MAIL_SECURE
//         ? process.env.MAIL_SECURE === "true"
//         : port === 465;
//     const pool = process.env.MAIL_POOL !== "false";
//     const poolMaxConnections = Number(process.env.MAIL_POOL_MAX_CONNECTIONS || 5);
//     const poolMaxMessages = Number(process.env.MAIL_POOL_MAX_MESSAGES || 100);
//     const tlsRejectUnauthorized = process.env.MAIL_TLS_REJECT_UNAUTHORIZED;
//     const tlsServerName = process.env.MAIL_TLS_SERVERNAME;
//     const requireTls = process.env.MAIL_REQUIRE_TLS
//         ? process.env.MAIL_REQUIRE_TLS === "true"
//         : !secure;
//     const key = `${process.env.MAIL_HOST}|${port}|${secure}|${requireTls}|${pool}|${poolMaxConnections}|${poolMaxMessages}|${tlsRejectUnauthorized}|${tlsServerName}|${process.env.MAIL_USERNAME}`;
//     if (cachedTransporter && cachedTransportKey === key) return cachedTransporter;

//     cachedTransportKey = key;
//     cachedVerifyPromise = undefined;
//     cachedVerifyKey = undefined;
//     cachedTransporter = nodemailer.createTransport({
//         host: process.env.MAIL_HOST,
//         port,
//         secure,
//         requireTLS: requireTls,
//         pool,
//         maxConnections: poolMaxConnections,
//         maxMessages: poolMaxMessages,
//         auth: {
//             user: process.env.MAIL_USERNAME,
//             pass: process.env.MAIL_PASSWORD,
//         },
//         connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT_MS || 30000),
//         greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT_MS || 30000),
//         socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT_MS || 60000),
//         tls: {
//             ...(typeof tlsServerName === "string" && tlsServerName.length > 0
//                 ? { servername: tlsServerName }
//                 : {}),
//             ...(typeof tlsRejectUnauthorized === "string"
//                 ? {
//                     rejectUnauthorized:
//                         tlsRejectUnauthorized !== "false" && tlsRejectUnauthorized !== "0",
//                 }
//                 : {}),
//         },
//     });

//     return cachedTransporter;
// }


function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
      user: "suryamjs1234@gmail.com",
      pass: "rekv rlxd unbz kpyg",
    },
    connectionTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });

  return cachedTransporter;
}


async function maybeVerifyTransporter(transporter) {
    if (process.env.MAIL_VERIFY_TRANSPORT !== "true") return;
    if (cachedVerifyPromise && cachedVerifyKey === cachedTransportKey) return cachedVerifyPromise;

    cachedVerifyKey = cachedTransportKey;
    cachedVerifyPromise = transporter.verify();
    try {
        await cachedVerifyPromise;
        logger.info(
            {
                mailHost: process.env.MAIL_HOST,
                mailPort: process.env.MAIL_PORT,
                mailSecure: process.env.MAIL_SECURE,
                mailUrlConfigured: Boolean(process.env.MAIL_URL),
            },
            "smtp_transport_verified"
        );
    } catch (err) {
        logger.error(
            {
                err,
                code: err && (err.code || err.errno),
                command: err && err.command,
                mailHost: process.env.MAIL_HOST,
                mailPort: process.env.MAIL_PORT,
                mailSecure: process.env.MAIL_SECURE,
                mailUrlConfigured: Boolean(process.env.MAIL_URL),
            },
            "smtp_transport_verify_failed"
        );
        throw err;
    }
}

function isMailConfigured() {
    const mailUrl = process.env.MAIL_URL;
    if (typeof mailUrl === "string" && mailUrl.length > 0) return true;
    return Boolean(
        process.env.MAIL_HOST &&
        process.env.MAIL_PORT &&
        process.env.MAIL_USERNAME &&
        process.env.MAIL_PASSWORD
    );
}

async function initMail() {
    const transporter = getTransporter();
    await maybeVerifyTransporter(transporter);
    return true;
}

// async..await is not allowed in global scope, must use a wrapper
// async function sendMail(msg = {}) {
//     msg = {...getDefaultValue(), ...msg}
//     if (!msg.to) return;
//     if (!msg.from) {
//         throw new Error(
//             "Email sender is not configured. Please set MAIL_FROM (recommended) or MAIL_USERNAME (or include a username in MAIL_URL)."
//         );
//     }
//     try {
//         const maxAttempts = Number(process.env.MAIL_SEND_MAX_ATTEMPTS || 2);
//         let lastErr;
//         for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//             try {
//                 const transporter = getTransporter();
//                 await maybeVerifyTransporter(transporter);
//                 const info = await transporter.sendMail(msg);
//                 logger.info(
//                     {
//                         messageId: info && info.messageId,
//                         to: msg.to,
//                         subject: msg.subject,
//                     },
//                     "email_sent"
//                 );
//                 return info;
//             } catch (err) {
//                 lastErr = err;
//                 logger.error(
//                     {
//                         err,
//                         attempt,
//                         maxAttempts,
//                         code: err && (err.code || err.errno),
//                         command: err && err.command,
//                         responseCode: err && err.responseCode,
//                         response: err && err.response,
//                         to: msg.to,
//                         subject: msg.subject,
//                         mailHost: process.env.MAIL_HOST,
//                         mailPort: process.env.MAIL_PORT,
//                         mailSecure: process.env.MAIL_SECURE,
//                         mailUrlConfigured: Boolean(process.env.MAIL_URL),
//                     },
//                     "email_send_failed"
//                 );
//                 if (attempt >= maxAttempts || !isRetryableMailError(err)) {
//                     throw err;
//                 }
//                 await sleep(500 * attempt);
//             }
//         }

//         if (lastErr) throw lastErr;

//     } catch (err) {
//         logger.error({ err }, "email_send_failed_final");
//         throw err;
//     }
// }

async function sendMail(msg = {}) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"Locabidz" <${process.env.MAIL_USERNAME || "skfjd@gmail.com"}>`,
    to: msg.to,
    subject: msg.subject || "Locabidz Notification",
    text: msg.text,
    html: msg.html,
  };

  return await transporter.sendMail(mailOptions);
}

sendMail.isMailConfigured = isMailConfigured;
sendMail.init = initMail;

module.exports = sendMail