'use strict';

const { Service } = require('@hapipal/schmervice')
const shaEncode = require('@hugoheml/iut-encrypt')
const Jwt = require('@hapi/jwt');

module.exports = class UserService extends Service {

    async create(user) {

        const { User } = this.server.models();
        const { mailService } = this.server.services();

        const insertedUser = await User.query().insertAndFetch(user);

        mailService.sendWelcomeEmail(insertedUser).catch(console.error);

        return insertedUser;
    }

    list() {
        const { User } = this.server.models();

        return User.query();
    }

    async delete(id) {
        const { User } = this.server.models();

        const numDeleted = await User.query().deleteById(id);

        return numDeleted;
    }

    async update(id, data) {
        const { User } = this.server.models();

        return User.query().findById(id).patch(data);
    }

    async login(data) {
        const { User } = this.server.models();
        const user = await User.query().findOne({ email: data.email });

        if (!user) {
            return null;
        }

        const isPasswordValid = await shaEncode.compareSha1(data.password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return {
            isLogged: true,
            token: Jwt.token.generate(
                {
                    aud: 'urn:audience:iut',
                    iss: 'urn:issuer:iut',
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    scope: user.scope || 'user'
                },
                {
                    key: 'random_string',
                    algorithm: 'HS512'
                },
                {
                    ttlSec: 14400
                }
            )
        };
    }
}
