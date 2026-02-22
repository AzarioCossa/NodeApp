'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class Favorite extends Model {

    static get tableName() {

        return 'favorite';
    }

    static get idColumn() {

        return ['userId', 'movieId'];
    }

    static get joiSchema() {

        return Joi.object({
            userId: Joi.number().integer().greater(0).required(),
            movieId: Joi.number().integer().greater(0).required()
        });
    }

};
