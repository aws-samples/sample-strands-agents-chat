import React, { createContext, type ReactNode } from 'react';
import useSWR from 'swr';
import type { Parameter, ParameterContextType } from '../types/parameter';
import useApi from '../hooks/useApi';
import useConfig from '../hooks/useConfig';

// Create the parameter context
const ParameterContext = createContext<ParameterContextType | undefined>(
  undefined
);

// Export for useParameter hook
export { ParameterContext };

// Parameter provider props
interface ParameterProviderProps {
  children: ReactNode;
}

// Parameter provider component
export const ParameterProvider: React.FC<ParameterProviderProps> = ({
  children,
}) => {
  const { config } = useConfig();
  const { httpRequest } = useApi();

  // Create fetcher function that uses authenticated request
  const fetcher = async (url: string): Promise<Parameter> => {
    const response = await httpRequest(url, 'GET');
    if (!response.ok) {
      throw new Error('Failed to fetch parameter');
    }
    return response.json();
  };

  // Only fetch when config is available
  const parameterEndpoint = config?.apiEndpoint
    ? `${config.apiEndpoint}parameter`
    : null;

  const { data, error } = useSWR(parameterEndpoint, fetcher, {
    // Fetch only on mount, no revalidation afterwards
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    // No deduping interval since we don't persist
    dedupingInterval: 0,
    // Limit error retries
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    // Use Suspense to block rendering until data is loaded
    suspense: true,
  });

  // With Suspense, data will always be available when this renders
  const parameter: Parameter = data;

  // Context value
  const contextValue: ParameterContextType = {
    parameter,
    isLoading: false, // Always false with Suspense
    error,
  };

  return (
    <ParameterContext.Provider value={contextValue}>
      {children}
    </ParameterContext.Provider>
  );
};
