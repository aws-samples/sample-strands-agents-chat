import { Parameter } from './parameter.types';

/**
 * Application configuration parameters for the Strands Chat application.
 * This template should be copied and customized for each deployment environment.
 */
export const parameter: Parameter = {
  // The AWS region where the application will be deployed
  appRegion: 'ap-northeast-1',

  // Models available for users to select in the UI
  // Each model can specify a display name and region
  // Model access must be enabled in the respective regions
  models: [
    {
      id: 'apac.anthropic.claude-sonnet-4-20250514-v1:0',
      region: 'ap-northeast-1',
      displayName: 'Claude Sonnet 4 (APAC)',
    },
    {
      id: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      region: 'us-west-2',
      displayName: 'Claude Sonent 4 (US)',
    },
  ],

  // Configuration for web search functionality using Tavily API
  // Create a Secret with the plain text Tavily API Key and specify its ARN here
  // Set to null if web search is not needed (web search will be unavailable)
  tavilyApiKeySecretArn: null,

  // AWS region for Nova Canvas model used for image generation
  // Nova Canvas access must be enabled in the specified region
  novaCanvasRegion: 'ap-northeast-1',

  // Model configuration for chat title generation
  // Specify the model ID and region
  // A lightweight model is recommended
  createTitleModel: {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    region: 'ap-northeast-1',
  },
};
