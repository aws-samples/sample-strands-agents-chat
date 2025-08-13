// Parameter type definitions
export interface Model {
  id: string;
  region: string;
  displayName: string;
}

export interface Parameter {
  models: Model[];
  webSearch: boolean;
}

export interface ParameterContextType {
  parameter: Parameter;
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
}
