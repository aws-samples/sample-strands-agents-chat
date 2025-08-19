export interface Model {
  id: string;
  region: string;
  displayName?: string;
}

export interface Parameter {
  appRegion: string;
  models: Model[];
  tavilyApiKeySecretArn: string | null;
  novaCanvasRegion: string;
  createTitleModel: Omit<Model, 'displayName'>;
  agentCoreRegion: string;
  provisionedConcurrency: number;
}
