'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');
const sha1encoder = require('@hugoheml/iut-encrypt');

module.exports = class User extends Model {

    static get tableName() {

        return 'user';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
            lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
            username: Joi.string().min(3).example('JDoe').description('Username of the user'),
            email: Joi.string().min(3).example('jdoe@example.com').description('Email of the user'),
            password: Joi.string().min(8).example('safePassword').description('Password of the user'),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    $beforeInsert(queryContext) {

        this.updatedAt = new Date();
        this.createdAt = this.updatedAt;
        this.password = sha1encoder.sha1(this.password);
    }

    $beforeUpdate(opt, queryContext) {

        this.updatedAt = new Date();
    }

};