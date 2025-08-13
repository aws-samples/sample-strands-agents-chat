// Application configuration type definitions
export interface AppConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  identityPoolId: string;
  apiEndpoint: string;
}

export interface ConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
}
