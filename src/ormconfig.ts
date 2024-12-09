import configuration from './config/env.config';
//TypeOrm Configuration needed by Migrations Features
const databaseConfig = configuration().database;

export = databaseConfig;
