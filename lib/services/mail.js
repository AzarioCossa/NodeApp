'use strict';

const { Service } = require('@hapipal/schmervice');
const nodemailer = require('nodemailer');

module.exports = class MailService extends Service {

    constructor(...args) {
        super(...args);
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.ethereal.email',
            port: process.env.MAIL_PORT || 587,
            secure: process.env.MAIL_PORT == 465,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
    }

    async sendWelcomeEmail(user) {

        const info = await this.transporter.sendMail({
            from: '"IUT App" <no-reply@iut-app.com>',
            to: user.email,
            subject: 'Welcome to IUT Application!',
            text: `Welcome ${user.firstName} ${user.lastName}! Your account has been created.`,
            html: `<b>Welcome ${user.firstName} ${user.lastName}!</b><br/>Your account has been successfully created.`,
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return info;
    }
};
