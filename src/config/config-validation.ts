import * as Joi from 'joi';
export const configValidation = Joi.object({
  SERVER_PORT: Joi.number(),
  SERVER_JWT_SECRET: Joi.string(),
  SERVER_JWT_EXPIRATION_TIME: Joi.number(),
  TYPEORM_USERNAME: Joi.string().required(),
  TYPEORM_PASSWORD: Joi.string().required(),
  TYPEORM_DATABASE: Joi.string().required(),
  TYPEORM_HOST: Joi.string(),
  TYPEORM_PORT: Joi.number(),
  TYPEORM_SYNCHRONIZE: Joi.boolean(),
  TYPEORM_DROP_SCHEMA: Joi.boolean(),
  TYPEORM_RUN_MIGRATION: Joi.boolean(),
  TYPEORM_LOG: Joi.boolean(),
  CACHE_SERVER_PASSWORD: Joi.string(),
});
