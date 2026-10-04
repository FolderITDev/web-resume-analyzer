import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.url({
    message: 'DATABASE_URL must be a postgres:// URL. Copy .env.example to .env.',
  }),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Server environment, validated on first use so a misconfiguration fails with a clear message. */
export function env(): Env {
  cached ??= EnvSchema.parse(process.env);
  return cached;
}
