"use strict";
const nodemailer = require("nodemailer");

let defaultValue = {
    from: `"Locabidz " <${process.env.MAIL_USERNAME}>`, // sender address
    to: process.env.MAIL_USERNAME, // list of receivers
    subject: "Locabidz verification email", // Subject line
    text: "Please verify this link to access Locabidz! https://google.com", // plain text body
    html: "<b>Please verify this link to access Locabidz! <link>https://google.com</link></b>", // html body
}

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(msg = {}) {
    msg = {...defaultValue, ...msg}
    if (!msg.to) return;
    try {
        if (!process.env.MAIL_HOST || !process.env.MAIL_PORT || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
            throw new Error(
                "Email is not configured. Please set MAIL_HOST, MAIL_PORT, MAIL_USERNAME, and MAIL_PASSWORD in your environment (.env)."
            );
        }

        const port = Number(process.env.MAIL_PORT);
        const secure = port === 465;

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port,
            secure,
            auth: {
                user: process.env.MAIL_USERNAME, // generated ethereal user
                pass: process.env.MAIL_PASSWORD, // generated ethereal password
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail(msg);

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    } catch (err) {
        console.log("Email send failed:", err?.message || err)
        throw err;
    }
}

module.exports = sendMail