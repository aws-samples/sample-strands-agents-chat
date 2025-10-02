import { z } from 'zod';

const ModelSchema = z.object({
  id: z.string(),
  region: z.string(),
  displayName: z.string().optional(),
});

export const ParameterSchema = z.object({
  appRegion: z.string(),
  models: z.array(ModelSchema),
  tavilyApiKeySecretArn: z.union([z.null(), z.string()]),
  openWeatherApiKeySecretArn: z.union([z.null(), z.string()]),
  novaCanvasRegion: z.string(),
  createTitleModel: ModelSchema.omit({ displayName: true }),
  agentCoreRegion: z.string(),
  provisionedConcurrency: z
    .number()
    .int('Provisioned concurrency must be an integer')
    .min(0, 'Provisioned concurrency must be at least 0')
    .max(1000, 'Provisioned concurrency must not exceed 1000'),
});

export type Parameter = z.infer<typeof ParameterSchema>;
