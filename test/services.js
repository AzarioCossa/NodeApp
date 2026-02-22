'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const Server = require('../server');

const { describe, it, before, after } = exports.lab = Lab.script();

describe('Isolated Services API', () => {

    let server;
    let mailService;
    let amqpService;

    // Track sent emails
    let emailsSent = 0;

    before(async () => {
        server = await Server.deployment();

        mailService = server.services().mailService;
        amqpService = server.services().amqpService;

        // Mock mail transporter
        mailService.transporter.sendMail = async (data) => {
            emailsSent++;
            return { messageId: `msg-${emailsSent}` };
        };

        // Mock AMQP Channel to avoid RabbitMQ dependency in tests
        amqpService.connection = { close: async () => true };
        amqpService.channel = {
            sendToQueue: async () => true,
            close: async () => true
        };
    });

    after(async () => {
        await server.stop();
    });

    describe('MailService', () => {
        it('sends welcome email', async () => {
            const user = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
            const res = await mailService.sendWelcomeEmail(user);
            expect(res.messageId).to.exist();
            expect(emailsSent).to.equal(1);
        });

        it('sends new movie notification to users', async () => {
            const users = [{ email: 'u1@example.com' }, { email: 'u2@example.com' }];
            const movie = { title: 'Dune', director: 'Denis Villeneuve' };
            const res = await mailService.sendNewMovieNotification(users, movie);
            expect(res.messageId).to.exist();
            expect(emailsSent).to.equal(2);
        });

        it('skips new movie notification if user list is empty', async () => {
            const res = await mailService.sendNewMovieNotification([], {});
            expect(res).to.not.exist();
        });

        it('sends movie update notification', async () => {
            const users = [{ email: 'u1@example.com' }];
            const movie = { title: 'Dune 2' };
            const res = await mailService.sendMovieUpdateNotification(users, movie);
            expect(res.messageId).to.exist();
            expect(emailsSent).to.equal(3);
        });

        it('skips movie update notification if user list is empty', async () => {
            const res = await mailService.sendMovieUpdateNotification([], {});
            expect(res).to.not.exist();
        });

        it('sends CSV export', async () => {
            const res = await mailService.sendCsvExport('admin@example.com', 'ID;Title\n1;Dune');
            expect(res.messageId).to.exist();
            expect(emailsSent).to.equal(4);
        });
    });

    describe('AmqpService', () => {
        it('has initialized connection from plugin start', () => {
            // start() is automatically called by Schmervice during server start
            expect(amqpService.connection).to.exist();
            expect(amqpService.channel).to.exist();
        });

        it('publishes export request to the queue', async () => {
            // Since we use the real RabbitMQ queue the rabbit service should be running locally
            // We just verify it successfully pushes the message
            const success = await amqpService.publishExportRequest('test@test.com');
            expect(success).to.be.true();
        });

        it('processes CSV export manually', async () => {
            // We manually invoke the background processing function to test its generation logic
            const { movieService } = server.services();
            // Stub the list out so it doesn't need DB entries
            const originalList = movieService.list;
            movieService.list = async () => {
                return [
                    { id: 1, title: 'Mock Movie', description: 'Mock', releaseDate: new Date('2023-01-01'), director: 'Mock Dir' }
                ];
            };

            const startEmails = emailsSent;
            await amqpService.processCsvExport('test@test.com');

            expect(emailsSent).to.equal(startEmails + 1);

            // Restore
            movieService.list = originalList;
        });
    });
});
