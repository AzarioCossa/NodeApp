'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const Server = require('../server');
const shaEncode = require('@hugoheml/iut-encrypt');

const { describe, it, before, after } = exports.lab = Lab.script();

describe('User API', () => {

    let server;
    let userId;
    let adminToken;
    let userToken;

    before(async () => {
        // Initialize the server and database
        server = await Server.deployment();

        // Stub mailService to avoid actual emails during tests
        const { mailService } = server.services();
        mailService.sendWelcomeEmail = async () => true;
    });

    after(async () => {
        await server.stop();
    });

    it('POST /user - creates a new user successfully', async () => {
        const payload = {
            firstName: 'Test',
            lastName: 'User',
            username: 'testu',
            email: 'test@example.com',
            password: 'password123'
        };

        const res = await server.inject({
            method: 'POST',
            url: '/user',
            payload
        });

        expect(res.statusCode).to.equal(200);
        expect(res.result.firstName).to.equal('Test');
        userId = res.result.id;
    });

    it('POST /user/login - logs in successfully', async () => {
        const payload = {
            email: 'test@example.com',
            password: 'password123'
        };

        const res = await server.inject({
            method: 'POST',
            url: '/user/login',
            payload
        });

        expect(res.statusCode).to.equal(200);
        expect(res.result.login).to.equal('success');
        expect(res.result.token).to.exist();
        userToken = res.result.token;
    });

    it('POST /user - creates an admin user for testing', async () => {
        const payload = {
            firstName: 'Admin',
            lastName: 'User',
            username: 'adminu',
            email: 'admin@example.com',
            password: 'password123'
        };

        const res = await server.inject({
            method: 'POST',
            url: '/user',
            payload
        });

        expect(res.statusCode).to.equal(200);

        // Manually update the scope of the admin user to 'admin' using the Objections layer
        const { User } = server.models();
        await User.query().findById(res.result.id).patch({ scope: ['admin'] });

        // Login as admin to get token
        const loginRes = await server.inject({
            method: 'POST',
            url: '/user/login',
            payload: {
                email: 'admin@example.com',
                password: 'password123'
            }
        });

        expect(loginRes.statusCode).to.equal(200);
        adminToken = loginRes.result.token;
    });

    it('POST /user/login - fails on invalid password', async () => {
        const payload = {
            email: 'test@example.com',
            password: 'wrongpassword'
        };

        const res = await server.inject({
            method: 'POST',
            url: '/user/login',
            payload
        });

        expect(res.statusCode).to.equal(401);
    });

    it('POST /user/login - fails on invalid email', async () => {
        const payload = {
            email: 'notexist@example.com',
            password: 'password123'
        };

        const res = await server.inject({
            method: 'POST',
            url: '/user/login',
            payload
        });

        expect(res.statusCode).to.equal(401);
    });

    it('GET /users - lists users as admin', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/users',
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        expect(res.statusCode).to.equal(200);
        expect(Array.isArray(res.result)).to.be.true();
        expect(res.result.length).to.be.at.least(2);
    });

    it('GET /users - lists users as user', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/users',
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        expect(res.statusCode).to.equal(200);
    });

    it('GET /users - fails without token', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/users'
        });

        expect(res.statusCode).to.equal(401);
    });

    it('PATCH /user/{id} - updates user as admin', async () => {
        const res = await server.inject({
            method: 'PATCH',
            url: `/user/${userId}`,
            headers: {
                authorization: `Bearer ${adminToken}`
            },
            payload: {
                firstName: 'UpdatedName'
            }
        });

        expect(res.statusCode).to.equal(204);
        expect(res.result).to.be.null();
    });

    it('PATCH /user/{id} - fails to update user as regular user', async () => {
        const res = await server.inject({
            method: 'PATCH',
            url: `/user/${userId}`,
            headers: {
                authorization: `Bearer ${userToken}`
            },
            payload: {
                firstName: 'HackedName'
            }
        });

        expect(res.statusCode).to.equal(403);
    });

    it('DELETE /user/{id} - fails as regular user', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/user/${userId}`,
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        expect(res.statusCode).to.equal(403);
    });

    it('DELETE /user/{id} - deletes user as admin', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/user/${userId}`,
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        expect(res.statusCode).to.equal(204);
        expect(res.result).to.be.null();
    });
});
