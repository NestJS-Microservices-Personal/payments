import "dotenv/config"
import * as Joi from "joi";

interface EnvVars {
  PORT: number;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  NATS_SERVERS: string;
}

const envSchema= Joi.object({
  PORT: Joi.number().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_SUCCESS_URL: Joi.string().required(),
  STRIPE_CANCEL_URL: Joi.string().required(),
  NATS_SERVERS: Joi.array().items(Joi.string()).required(),
})
.unknown(true)

const { error, value } = envSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS.split(',')
});

if(error) throw  new Error(`Config Validation Error: ${error.message}`)

const envVars : EnvVars = value;

export const envs ={
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET_KEY,
  stripeWebhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
  natsServers: envVars.NATS_SERVERS,
}

