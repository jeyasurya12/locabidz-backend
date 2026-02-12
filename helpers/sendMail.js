"use strict";
const nodemailer = require("nodemailer");

let defaultValue = {
    from: `"Locabidz " <${process.env.MAIL_USERNAME}>`, // sender address
    to: process.env.MAIL_USERNAME, // list of receivers
    subject: "Locabidz verification email", // Subject line
    text: "Please verify this link to access Locabidz! https://google.com", // plain text body
    html: "<b>Please verify this link to access Locabidz! <link>https://google.com</link></b>", // html body
}

let cachedTransporter;
let cachedTransportKey;

function getTransporter() {
    if (!process.env.MAIL_HOST || !process.env.MAIL_PORT || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
        throw new Error(
            "Email is not configured. Please set MAIL_HOST, MAIL_PORT, MAIL_USERNAME, and MAIL_PASSWORD in your environment (.env)."
        );
    }

    const port = Number(process.env.MAIL_PORT);
    const secure = port === 465;
    const key = `${process.env.MAIL_HOST}|${port}|${secure}|${process.env.MAIL_USERNAME}`;
    if (cachedTransporter && cachedTransportKey === key) return cachedTransporter;

    cachedTransportKey = key;
    cachedTransporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port,
        secure,
        requireTLS: !secure,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
        connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT_MS || 10000),
        socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT_MS || 20000),
    });

    return cachedTransporter;
}

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(msg = {}) {
    msg = {...defaultValue, ...msg}
    if (!msg.to) return;
    try {
        const transporter = getTransporter();

        // send mail with defined transport object
        let info = await transporter.sendMail(msg);

        if (process.env.NODE_ENV !== "production") {
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

    } catch (err) {
        console.log("Email send failed:", err?.message || err)
        throw err;
    }
}

module.exports = sendMail