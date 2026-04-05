import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().default('root'),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().default('finance_db'),
  JWT_SECRET: Joi.string().required(),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(20).default(10),
  ACCESS_TOKEN_EXPIRY: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRY_DAYS: Joi.number().integer().min(1).default(7),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  port: envVars.PORT,
  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    database: envVars.DB_NAME,
  },
  jwtSecret: envVars.JWT_SECRET,
  auth: {
    bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
    accessTokenExpiry: envVars.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiryDays: envVars.REFRESH_TOKEN_EXPIRY_DAYS,
  },
  env: envVars.NODE_ENV,
};
