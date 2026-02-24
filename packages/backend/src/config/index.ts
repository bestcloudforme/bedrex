import { z } from 'zod';

const booleanString = z.string().transform((val) => val === 'true' || val === '1').default('false');

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  USE_MOCK_DATA: booleanString,
  AWS_REGION: z.string().default('us-east-1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  CACHE_ENABLED: z.string().transform((val) => val !== 'false' && val !== '0').default('true'),
  AWS_ACCOUNT_ID: z.string().regex(/^\d{12}$/).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadConfig(): EnvConfig {
  return envSchema.parse(process.env);
}

export const config = loadConfig();
