'use strict';

const Joi = require('joi');

module.exports = [
    {
        method: 'POST',
        path: '/movie',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            validate: {
                payload: Joi.object({
                    title: Joi.string().required().example('Redemption').description('Title of the movie'),
                    description: Joi.string().required().example('A man who has just returned from prison finds out that, just before dying, his mother took on a dangerous debt. Although he wants to turn a new leaf, he is forced to once again go back to a life of crime as he needs money desperately.').description('Description of the movie'),
                    releaseDate: Joi.date().required().example('2018-07-18').description('Release date of the movie'),
                    director: Joi.string().required().example('Mickey Fonseca').description('Director of the movie')
                })
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.create(request.payload);
        }
    },
    {
        method: 'GET',
        path: '/movies',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin', 'user']
            }
        },
        handler: async (request, h) => {
            const { movieService } = request.services();
            return await movieService.list();
        }
    },
    {
        method: 'PATCH',
        path: '/movie/{id}',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            validate: {
                params: Joi.object({
                    id: Joi.number().required()
                }),
                payload: Joi.object({
                    title: Joi.string().example('Redemption').description('Title of the movie'),
                    description: Joi.string().example('A man who has just returned from prison finds out that, just before dying, his mother took on a dangerous debt. Although he wants to turn a new leaf, he is forced to once again go back to a life of crime as he needs money desperately.').description('Description of the movie'),
                    releaseDate: Joi.date().example('2018-07-18').description('Release date of the movie'),
                    director: Joi.string().example('Mickey Fonseca').description('Director of the movie')
                })
            }
        },
        handler: async (request, h) => {
            const { id } = request.params;
            const { movieService } = request.services();

            const isUpdated = await movieService.update(id, request.payload);
            return isUpdated ? '' : 'Error while updating movie';
        }
    },
    {
        method: 'DELETE',
        path: '/movie/{id}',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            validate: {
                params: Joi.object({
                    id: Joi.number().required()
                })
            }
        },
        handler: async (request, h) => {
            const { id } = request.params;
            const { movieService } = request.services();

            const isDeleted = await movieService.delete(id);
            return isDeleted ? '' : 'Error while deleting movie';
        }
    },
    {
        method: 'GET',
        path: '/movies/export',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            }
        },
        handler: async (request, h) => {
            const { amqpService } = request.services();
            const email = request.auth.credentials.email;

            await amqpService.publishExportRequest(email);

            return h.response({ message: 'Export requested. You will receive an email shortly.' }).code(202);
        }
    }
];
