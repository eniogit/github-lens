import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const configSchema = z
  .object({
    CLIENT_ID: z.string().min(1),
    CLIENT_SECRET: z.string().min(1),
    DB_HOST: z.string().min(1),
    DB_PORT: z.number({ coerce: true }).min(1),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    PRIVATE_ACCESS_TOKEN: z.string().min(1),
    FRONTEND_URL: z.string().url(),
  })
  .required();

export type Config = z.infer<typeof configSchema>;

@Injectable()
export class ConfigService {
  public readonly config: Config;

  constructor() {
    const env = process.env;

    const parsedEnv = configSchema.safeParse(env);

    if (!parsedEnv.success) {
      console.log('Invalid environment variables', parsedEnv.error.format());

      throw new Error('Invalid environment variables');
    }
    this.config = parsedEnv.data;
    console.log('Environment variables loaded successfully');
    console.log(this.config);
  }
}
