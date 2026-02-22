'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const Server = require('../server');

const { describe, it, before, after } = exports.lab = Lab.script();

describe('Movie API', () => {

    let server;
    let adminToken;
    let userToken;
    let movieId;

    before(async () => {
        server = await Server.deployment();

        // Stub mailService to avoid actual emails
        const { mailService } = server.services();
        mailService.sendNewMovieNotification = async () => true;
        mailService.sendMovieUpdateNotification = async () => true;
        mailService.sendCsvExport = async () => true;

        // Stub AmqpService to avoid RabbitMQ connection errors
        const { amqpService } = server.services();
        amqpService.publishExportRequest = async () => true;

        // Create Admin User
        const adminPayload = {
            firstName: 'Admin', lastName: 'User',
            username: 'madmin', email: 'madmin@example.com',
            password: 'password123'
        };
        const resAdmin = await server.inject({ method: 'POST', url: '/user', payload: adminPayload });
        const { User } = server.models();
        await User.query().findById(resAdmin.result.id).patch({ scope: ['admin'] });

        const loginAdmin = await server.inject({
            method: 'POST', url: '/user/login',
            payload: { email: 'madmin@example.com', password: 'password123' }
        });
        adminToken = loginAdmin.result.token;

        // Create Regular User
        const userPayload = {
            firstName: 'Reg', lastName: 'User',
            username: 'regu', email: 'regu@example.com',
            password: 'password123'
        };
        await server.inject({ method: 'POST', url: '/user', payload: userPayload });

        const loginUser = await server.inject({
            method: 'POST', url: '/user/login',
            payload: { email: 'regu@example.com', password: 'password123' }
        });
        userToken = loginUser.result.token;
    });

    after(async () => {
        await server.stop();
    });

    it('POST /movie - creates a new movie as admin', async () => {
        const payload = {
            title: 'Test Movie',
            description: 'A test description',
            releaseDate: '2023-10-10',
            director: 'Test Director'
        };

        const res = await server.inject({
            method: 'POST',
            url: '/movie',
            headers: { authorization: `Bearer ${adminToken}` },
            payload
        });

        expect(res.statusCode).to.equal(200);
        expect(res.result.title).to.equal('Test Movie');
        movieId = res.result.id;
    });

    it('POST /movie - fails as regular user', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/movie',
            headers: { authorization: `Bearer ${userToken}` },
            payload: {
                title: 'Test Movie 2',
                description: 'A test description',
                releaseDate: '2023-10-10',
                director: 'Test Director'
            }
        });

        expect(res.statusCode).to.equal(403);
    });

    it('GET /movies - lists out movies successfully', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/movies',
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(200);
        expect(Array.isArray(res.result)).to.be.true();
        expect(res.result.length).to.be.at.least(1);
    });

    it('PATCH /movie/{id} - updates movie as admin', async () => {
        const payload = {
            title: 'Updated Test Movie'
        };

        const res = await server.inject({
            method: 'PATCH',
            url: `/movie/${movieId}`,
            headers: { authorization: `Bearer ${adminToken}` },
            payload
        });

        expect(res.statusCode).to.equal(204);
        expect(res.result).to.be.null();
    });

    it('GET /movies/export - queuing export returns 202 as admin', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/movies/export',
            headers: { authorization: `Bearer ${adminToken}` }
        });

        expect(res.statusCode).to.equal(202);
    });

    it('GET /movies/export - queuing fails as regular user', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/movies/export',
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(403);
    });

    it('DELETE /movie/{id} - deletes movie as admin', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/movie/${movieId}`,
            headers: { authorization: `Bearer ${adminToken}` }
        });

        expect(res.statusCode).to.equal(204);
        expect(res.result).to.be.null();
    });
});
