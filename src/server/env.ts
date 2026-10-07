import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.url({
    message: 'DATABASE_URL must be a postgres:// URL. Copy .env.example to .env.',
  }),
});

const AnalysisEngineEnvSchema = z.object({
  ANALYSIS_ENGINE_URL: z.url({
    protocol: /^https?$/,
    message: 'ANALYSIS_ENGINE_URL must be the http(s) base URL of the analysis engine.',
  }),
  ANALYSIS_ENGINE_API_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Server environment, validated on first use so a misconfiguration fails with a clear message. */
export function env(): Env {
  cached ??= EnvSchema.parse(process.env);
  return cached;
}

/** Analysis engine settings, validated separately so database-only scripts do not need them. */
export const analysisEngineEnv = {
  safeParse: () => AnalysisEngineEnvSchema.safeParse(process.env),
};
