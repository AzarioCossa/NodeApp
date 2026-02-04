'use strict';

const { Service } = require('@hapipal/schmervice')
const shaEncode = require('@hugoheml/iut-encrypt')

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

    async update(id, data) {
        const { User } = this.server.models();

        return User.query().findById(id).patch(data);
    }

    async login(data) {
        const { User } = this.server.models();

        const user = await User.query().findOne({ email: data.email });

        if (!user) {
            console.log("Usuário não encontrado");
            return false;
        }

        const isPasswordValid = await shaEncode.compareSha1(data.password, user.password);

        return isPasswordValid ? user : false;
    }
}
