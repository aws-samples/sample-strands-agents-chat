import React, { createContext, type ReactNode } from 'react';
import useSWR from 'swr';
import type { AppConfig, ConfigContextType } from '../types/config';

// Fetcher function for SWR
const fetcher = async (url: string): Promise<AppConfig> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch config');
  }
  return response.json();
};

// Create the configuration context
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Export for useConfig hook
export { ConfigContext };

// Configuration provider props
interface ConfigProviderProps {
  children: ReactNode;
}

// Configuration provider component
export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const configEndpoint = import.meta.env.VITE_CONFIG_ENDPOINT!;

  const { data, error, isLoading } = useSWR(configEndpoint, fetcher, {
    // Fetch only on mount, no revalidation afterwards
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    // Long deduping interval to prevent duplicate requests
    dedupingInterval: 24 * 60 * 60 * 1000, // 24 hours
    // Limit error retries
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    // Don't use Suspense (manage loading state manually)
    suspense: false,
  });

  // Only provide config when data is available
  const config: AppConfig | null = data || null;

  // Context value
  const contextValue: ConfigContextType = {
    config,
    isLoading,
    error,
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};
