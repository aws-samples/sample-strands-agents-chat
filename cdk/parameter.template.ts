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
      id: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
      region: 'us-east-1',
      displayName: 'Claude Sonnet 4.5',
    },
    {
      id: 'us.anthropic.claude-opus-4-1-20250805-v1:0',
      region: 'us-east-1',
      displayName: 'Claude Opus 4.1',
    },
    {
      id: 'us.amazon.nova-premier-v1:0',
      region: 'us-east-1',
      displayName: 'Nove Premier',
    },
  ],

  // Configuration for web search functionality using Tavily API
  // Create a Secret with the plain text Tavily API Key and specify its ARN here
  // Set to null if web search is not needed (web search will be unavailable)
  tavilyApiKeySecretArn: null,

  // Configuration for weather functionality using OpenWeatherMap API
  // Create a Secret with the plain text OpenWeatherMap API Key and specify its ARN here
  // Set to null if weather functionality is not needed (weather tools will be unavailable)
  // Get your free API key at: https://openweathermap.org/api
  openWeatherApiKeySecretArn: null,

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

  // AgentCore configuration
  agentCoreRegion: 'us-east-1',

  // Provisioned concurrency configuration for Lambda function
  // Set the number of concurrent executions to keep warm (0-1000)
  // Default: 10 concurrent executions to minimize cold start latency
  // Set to 0 to disable provisioned concurrency
  provisionedConcurrency: 5,
};
