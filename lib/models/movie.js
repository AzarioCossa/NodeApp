'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class Movie extends Model {

    static get tableName() {

        return 'movie';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            title: Joi.string().min(1).required().example('Redemption').description('Title of the movie'),
            description: Joi.string().required().example('A man who has just returned from prison finds out that, just before dying, his mother took on a dangerous debt. Although he wants to turn a new leaf, he is forced to once again go back to a life of crime as he needs money desperately.').description('Description of the movie'),
            releaseDate: Joi.date().required().example('2018-07-18').description('Release date of the movie'),
            director: Joi.string().required().example('Mickey Fonseca').description('Director of the movie'),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    $beforeInsert(queryContext) {

        this.updatedAt = new Date();
        this.createdAt = this.updatedAt;
    }

    $beforeUpdate(opt, queryContext) {

        this.updatedAt = new Date();
    }

};
