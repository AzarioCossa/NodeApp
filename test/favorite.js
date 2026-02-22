'use strict';

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const Server = require('../server');

const { describe, it, before, after } = exports.lab = Lab.script();

describe('Favorite API', () => {

    let server;
    let userToken;
    let movieId;

    before(async () => {
        server = await Server.deployment();

        // Stub mailService to avoid actual emails
        const { mailService } = server.services();
        mailService.sendWelcomeEmail = async () => true;
        mailService.sendNewMovieNotification = async () => true;
        mailService.sendMovieUpdateNotification = async () => true;

        // Create Admin User for movie creation
        const adminPayload = {
            firstName: 'Admin', lastName: 'User',
            username: 'fadmin', email: 'fadmin@example.com',
            password: 'password123'
        };
        const resAdmin = await server.inject({ method: 'POST', url: '/user', payload: adminPayload });
        const { User } = server.models();
        await User.query().findById(resAdmin.result.id).patch({ scope: ['admin'] });

        const loginAdmin = await server.inject({
            method: 'POST', url: '/user/login',
            payload: { email: 'fadmin@example.com', password: 'password123' }
        });
        const adminToken = loginAdmin.result.token;

        // Create Regular User for favorites
        const userPayload = {
            firstName: 'Reg', lastName: 'User',
            username: 'fregu', email: 'fregu@example.com',
            password: 'password123'
        };
        await server.inject({ method: 'POST', url: '/user', payload: userPayload });

        const loginUser = await server.inject({
            method: 'POST', url: '/user/login',
            payload: { email: 'fregu@example.com', password: 'password123' }
        });
        userToken = loginUser.result.token;

        // Create a movie to favorite
        const moviePayload = {
            title: 'Favorite Test Movie',
            description: 'Favorite description',
            releaseDate: '2023-11-11',
            director: 'Favorite Director'
        };
        const movieRes = await server.inject({
            method: 'POST', url: '/movie',
            headers: { authorization: `Bearer ${adminToken}` },
            payload: moviePayload
        });
        movieId = movieRes.result.id;
    });

    after(async () => {
        await server.stop();
    });

    it('POST /movie/{movieId}/favorite - adds a favorite successfully', async () => {
        const res = await server.inject({
            method: 'POST',
            url: `/movie/${movieId}/favorite`,
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(200);
        expect(res.result.movieId).to.equal(movieId);
    });

    it('POST /movie/{movieId}/favorite - fails on duplicate (409 Conflict)', async () => {
        const res = await server.inject({
            method: 'POST',
            url: `/movie/${movieId}/favorite`,
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(409);
        expect(res.result.message).to.equal('Movie already in favorites');
    });

    it('POST /movie/9999/favorite - fails on non-existent movie (404 Not Found)', async () => {
        const res = await server.inject({
            method: 'POST',
            url: `/movie/9999/favorite`,
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(404);
        expect(res.result.message).to.equal('Movie not found');
    });

    it('GET /user/favorites - lists user favorites', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/user/favorites',
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(200);
        expect(Array.isArray(res.result)).to.be.true();
        expect(res.result.length).to.equal(1);
        expect(res.result[0].id).to.equal(movieId);
    });

    it('DELETE /movie/9999/favorite - fails on non-existent favorite removal (404 Not Found)', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/movie/9999/favorite`,
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(404);
        expect(res.result.message).to.equal('Movie not found in favorites');
    });

    it('DELETE /movie/{movieId}/favorite - removes a favorite successfully', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/movie/${movieId}/favorite`,
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(204);
        expect(res.result).to.be.null();
    });

    it('GET /user/favorites - returns empty list when no favorites', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/user/favorites',
            headers: { authorization: `Bearer ${userToken}` }
        });

        expect(res.statusCode).to.equal(200);
        expect(Array.isArray(res.result)).to.be.true();
        expect(res.result.length).to.equal(0);
    });
});
