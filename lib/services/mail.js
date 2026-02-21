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
            html: `<b>Welcome ${user.firstName} ${user.lastName}!</b><br/>Your account has been successfully created.`
        });

        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return info;
    }

    async sendNewMovieNotification(users, movie) {
        if (!users || users.length === 0) {
            return;
        }

        const emails = users.map((u) => u.email).join(', ');

        const info = await this.transporter.sendMail({
            from: '"IUT App" <no-reply@iut-app.com>',
            to: emails,
            subject: 'New Movie Available!',
            text: `A new movie "${movie.title}" directed by ${movie.director} has just been added!`,
            html: `<b>New Movie Added!</b><br/>"${movie.title}" directed by ${movie.director} has just been added. Check it out!`
        });

        console.log('New Movie Notification sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return info;
    }

    async sendMovieUpdateNotification(users, movie) {
        if (!users || users.length === 0) {
            return;
        }

        const emails = users.map((u) => u.email).join(', ');

        const info = await this.transporter.sendMail({
            from: '"IUT App" <no-reply@iut-app.com>',
            to: emails,
            subject: 'A Favorite Movie Was Updated',
            text: `Your favorite movie "${movie.title}" has been updated.`,
            html: `<b>Update on your favorite!</b><br/>"${movie.title}" has been updated by an admin.`
        });

        console.log('Movie Update Notification sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return info;
    }
};
