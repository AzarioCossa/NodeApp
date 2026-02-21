'use strict';

const Dotenv = require('dotenv');
const Confidence = require('@hapipal/confidence');
const Toys = require('@hapipal/toys');
const Schwifty = require('@hapipal/schwifty');

// Pull .env into process.env
Dotenv.config({ path: `${__dirname}/.env` });

// Glue manifest as a confidence store
module.exports = new Confidence.Store({
    server: {
        host: 'localhost',
        port: {
            $env: 'PORT',
            $coerce: 'number',
            $default: 3000
        },
        debug: {
            $filter: { $env: 'NODE_ENV' },
            $default: {
                log: ['error'],
                request: ['error']
            },
            production: {
                request: ['implementation']
            }
        }
    },
    register: {
        plugins: [
            {
                plugin: '../lib', // Main plugin
                options: {}
            },
            {
                plugin: './plugins/swagger'
            },
            {
                plugin: '@hapipal/schwifty',
                options: {
                    $filter: { $env: 'NODE_ENV' }, // Correctly filter on the environment variable
                    $base: {
                        migrateOnStart: true,
                        knex: {
                            migrations: {
                                stub: Schwifty.migrationsStubPath
                            }
                        }
                    },
                    production: {
                        migrateOnStart: false, // Usually false in prod to run migrations manually
                        knex: {
                            client: 'mysql',
                            connection: {
                                host: process.env.DB_HOST || '0.0.0.0',
                                user: process.env.DB_USER || 'root',
                                password: process.env.DB_PASSWORD || 'hapi',
                                database: process.env.DB_DATABASE || 'user',
                                port: process.env.DB_PORT || 3306
                            }
                        }
                    },
                    $default: { // Used for development (SQLite)
                        knex: {
                            client: 'sqlite3',
                            useNullAsDefault: true,
                            connection: {
                                filename: ':memory:'
                            }
                        }
                    }
                }
            }
        ]
    }
});
