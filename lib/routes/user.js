'use strict';

const Joi = require('joi')
const {code} = require("@hapipal/toys");
const Boom = require('@hapi/boom');

module.exports = [
    {
        method: 'post',
        path: '/user',
        options: {
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().required().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().required().min(3).example('Doe').description('Lastname of the user'),
                    username: Joi.string().min(3).example('JDoe').description('Username of the user'),
                    email: Joi.string().min(3).email().example('jdoe@example.com').description('Email of the user'),
                    password: Joi.string().min(8).example('safePassword').description('Password of the user'),
                })
            }
        },
        handler: async (request, h) => {

            const { userService } = request.services();

            return userService.create(request.payload);
        }
    },
    {
        method: 'get',
        path: '/users',
        options: {
            tags: ['api'],
        },
        handler: async (request, h) => {

            const { userService } = request.services();

            return userService.list();
        }
    },
    {
        method: 'DELETE',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().required(),
                })
            }
        },
        handler: async (request, h) => {
            const { id } = request.params;
            console.log("Caught id is  "+id);
            const { userService } = request.services();

            const isDeleted = await userService.delete(id);

            if (isDeleted) {
                return "";
            }else{
                return "error while deleting user  "+id+" isDeleted : "+isDeleted;
            }


        }
    },
    {
        method: 'PATCH',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number().required(),
                }),
                payload: Joi.object({
                    firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
                    username: Joi.string().min(3).example('JDoe').description('Username of the user'),
                    email: Joi.string().min(3).email().example('jdoe@example.com').description('Email of the user'),
                    password: Joi.string().min(8).example('safePassword').description('Password of the user'),
                })
            }
        },
        handler: async (request, h) => {
            const { id } = request.params;
            const { userService } = request.services();

            const isUpdated = await userService.update(id, request.payload);

            if (isUpdated) {
                return "";
            }else{
                return "error while updating user  "+request.params+" isDeleted : "+isUpdated;
            }


        }
    },
    {
        method: 'POST',
        path: '/user/login',
        options: {
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required().example('jdoe@example.com').description('Email of the user'),
                    password: Joi.string().required().example('safePassword').description('Password of the user'),
                })
            }
        },
        handler: async (request, h) => {
            const { userService } = request.services();
            const result = await userService.login(request.payload);

            if (!result) {
                return Boom.unauthorized('Invalid email or password');
            }

            return {
                login: "successful",
            };
        }
    }
    ];