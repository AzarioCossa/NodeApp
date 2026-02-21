'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');

module.exports = class FavoriteService extends Service {

    async add(userId, movieId) {
        const { Favorite, Movie } = this.server.models();

        // Ensure the movie exists
        const movie = await Movie.query().findById(movieId);
        if (!movie) {
            throw Boom.notFound('Movie not found');
        }

        // Ensure the user hasn't already favorited it
        const existing = await Favorite.query().findOne({ userId, movieId });
        if (existing) {
            throw Boom.conflict('Movie already in favorites');
        }

        return Favorite.query().insertAndFetch({ userId, movieId });
    }

    async remove(userId, movieId) {
        const { Favorite } = this.server.models();

        const numDeleted = await Favorite.query().delete().where({ userId, movieId });

        if (numDeleted === 0) {
            throw Boom.notFound('Movie not found in favorites');
        }

        return numDeleted;
    }

    async listByUser(userId) {
        const { Favorite, Movie } = this.server.models();

        // Get favorites then fetch the actual movies (this can also be done using relationMappings)
        const favorites = await Favorite.query().where({ userId });
        if (!favorites.length) {
            return [];
        }

        const movieIds = favorites.map((f) => f.movieId);
        return Movie.query().findByIds(movieIds);
    }
};
