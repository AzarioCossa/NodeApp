'use strict';

const Joi = require('joi');

module.exports = [
    {
        method: 'POST',
        path: '/movie/{movieId}/favorite',
        options: {
            tags: ['api'],
            auth: {
                scope: ['user', 'admin']
            },
            validate: {
                params: Joi.object({
                    movieId: Joi.number().required().description('ID array param of the movie to favorite')
                })
            }
        },
        handler: async (request, h) => {
            const { favoriteService } = request.services();
            const { movieId } = request.params;
            const userId = request.auth.credentials.id;

            return await favoriteService.add(userId, movieId);
        }
    },
    {
        method: 'DELETE',
        path: '/movie/{movieId}/favorite',
        options: {
            tags: ['api'],
            auth: {
                scope: ['user', 'admin']
            },
            validate: {
                params: Joi.object({
                    movieId: Joi.number().required()
                })
            }
        },
        handler: async (request, h) => {
            const { favoriteService } = request.services();
            const { movieId } = request.params;
            const userId = request.auth.credentials.id;

            const numDeleted = await favoriteService.remove(userId, movieId);
            if (numDeleted) {
                return '';
            }

            return 'Error removing favorite';
        }
    },
    {
        method: 'GET',
        path: '/user/favorites',
        options: {
            tags: ['api'],
            auth: {
                scope: ['user', 'admin']
            }
        },
        handler: async (request, h) => {
            const { favoriteService } = request.services();
            const userId = request.auth.credentials.id;

            return await favoriteService.listByUser(userId);
        }
    }
];
