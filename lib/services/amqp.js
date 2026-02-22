'use strict';

const { Service } = require('@hapipal/schmervice');
const amqp = require('amqplib');

module.exports = class AmqpService extends Service {

    async start() {
        try {
            const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
            this.connection = await amqp.connect(rabbitUrl);
            this.channel = await this.connection.createChannel();

            const queueName = 'export_movies_queue';
            await this.channel.assertQueue(queueName, { durable: true });

            console.log('AmqpService: Connected to RabbitMQ and consuming from', queueName);

            this.channel.consume(queueName, async (msg) => {
                if (msg !== null) {
                    try {
                        const payload = JSON.parse(msg.content.toString());
                        console.log(`AmqpService: Received export request for ${payload.email}`);

                        await this.processCsvExport(payload.email);

                        this.channel.ack(msg);
                    }
                    catch (err) {
                        console.error('AmqpService: Error processing message', err);
                        this.channel.nack(msg, false, false);
                    }
                }
            });

        }
        catch (error) {
            console.error('AmqpService: Failed to connect or setup RabbitMQ:', error);
        }
    }

    async stop() {
        if (this.channel) {
            await this.channel.close();
        }

        if (this.connection) {
            await this.connection.close();
        }
    }

    publishExportRequest(email) {
        if (!this.channel) {
            throw new Error('AmqpService: Channel is not initialized');
        }

        const queueName = 'export_movies_queue';
        const msg = JSON.stringify({ email });

        return this.channel.sendToQueue(queueName, Buffer.from(msg), { persistent: true });
    }

    async processCsvExport(email) {
        const { movieService, mailService } = this.server.services();

        const movies = await movieService.list();
        const header = ['ID', 'Title', 'Description', 'ReleaseDate', 'Director'].join(';');

        const rows = movies.map((m) => {
            const title = `"${(m.title || '').replace(/"/g, '""')}"`;
            const description = `"${(m.description || '').replace(/"/g, '""')}"`;
            const releaseDate = m.releaseDate ? m.releaseDate.toISOString().split('T')[0] : '';
            const director = `"${(m.director || '').replace(/"/g, '""')}"`;

            return [m.id, title, description, releaseDate, director].join(';');
        });

        const csvContent = [header, ...rows].join('\n');

        await mailService.sendCsvExport(email, csvContent);
        console.log(`AmqpService: CSV Export sent to ${email}`);
    }
};
