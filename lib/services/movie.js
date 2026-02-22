'use strict';

const { Service } = require('@hapipal/schmervice');

module.exports = class MovieService extends Service {

    async create(movie) {

        const { Movie, User } = this.server.models();
        const { mailService } = this.server.services();

        const insertedMovie = await Movie.query().insertAndFetch(movie);

        const users = await User.query();
        mailService.sendNewMovieNotification(users, insertedMovie).catch(console.error);

        return insertedMovie;
    }

    list() {
        const { Movie } = this.server.models();

        return Movie.query();
    }

    async delete(id) {
        const { Movie } = this.server.models();

        const numDeleted = await Movie.query().deleteById(id);

        return numDeleted;
    }

    async update(id, data) {
        const { Movie, Favorite, User } = this.server.models();
        const { mailService } = this.server.services();

        const updatedMovie = await Movie.query().patchAndFetchById(id, data);

        if (updatedMovie) {
            const favorites = await Favorite.query().where('movieId', id);
            if (favorites.length > 0) {
                const userIds = favorites.map((f) => f.userId);
                const usersToNotify = await User.query().findByIds(userIds);
                mailService.sendMovieUpdateNotification(usersToNotify, updatedMovie).catch(console.error);
            }
        }

        return updatedMovie;
    }

};
