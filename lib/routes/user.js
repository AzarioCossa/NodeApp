'use strict';

const Joi = require('joi')

module.exports = [
    {
        method: 'post',
        path: '/user',
        options: {
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().required().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().required().min(3).example('Doe').description('Lastname of the user')
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
    }
    ];