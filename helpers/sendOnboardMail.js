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
            port: process.env.MAIL_PORT,
            secure: false, 
            auth: {
                user: process.env.MAIL_USERNAME, 
                pass: process.env.MAIL_PASSWORD,
            },
        });
        let info = await transporter.sendOnboardMail(msg);

        console.log("Message sent: %s", info.messageId);

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    } catch (err) {
        console.log("S-s-s>>>>>>>>>>>>", err)
    }
}

module.exports = sendOnboardMail