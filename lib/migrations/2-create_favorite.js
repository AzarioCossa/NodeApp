'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('favorite', (table) => {

            table.integer('userId').unsigned().notNull().references('id').inTable('user').onDelete('CASCADE');
            table.integer('movieId').unsigned().notNull().references('id').inTable('movie').onDelete('CASCADE');

            table.primary(['userId', 'movieId']);
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('favorite');
    }
};
