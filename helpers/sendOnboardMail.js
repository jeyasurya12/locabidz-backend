"use strict";
const nodemailer = require("nodemailer");

let defaultValue = {
    from: `"Locabidz " <${process.env.MAIL_USERNAME}>`, 
    to: process.env.MAIL_USERNAME, 
    subject: "Locabidz onboarding email", 
    text: "Please verify this link to access Locabidz! https://google.com", 
    html: "<b>Please verify this link to access Locabidz! <link>https://google.com</link></b>", 
}

async function sendOnboardMail(msg = {}) {
    msg = {...defaultValue, ...msg}
    if (!msg.to) return;
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: Number(process.env.MAIL_PORT) === 465,
            auth: {
                user: process.env.MAIL_USERNAME, 
                pass: process.env.MAIL_PASSWORD,
            },
            connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT_MS || 10000),
            greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT_MS || 10000),
            socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT_MS || 20000),
        });
        let info = await transporter.sendMail(msg);

        console.log("Message sent: %s", info.messageId);

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    } catch (err) {
        console.log("S-s-s>>>>>>>>>>>>", err)
    }
}

module.exports = sendOnboardMail