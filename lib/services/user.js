'use strict';

const { Service } = require('@hapipal/schmervice');

module.exports = class UserService extends Service {

    create(user){

        const { User } = this.server.models();

        return User.query().insertAndFetch(user);
    }

    list(){
        const { User } = this.server.models();

        return User.query();
    }

    async delete(id) {
        const { User } = this.server.models();

        const numDeleted = await User.query().deleteById(id);

        return numDeleted;
    }
}
