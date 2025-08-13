import { type ReactNode, useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import {
  Authenticator,
  ThemeProvider,
  translations,
} from '@aws-amplify/ui-react';
import { I18n } from 'aws-amplify/utils';
import useConfig from '../hooks/useConfig';
import './AuthWithUserPool.css';

const AuthWithUserPool = (props: { children: ReactNode }) => {
  const { config, isLoading, error } = useConfig();
  const [isConfigured, setIsConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for config to be loaded and ensure we have valid config
    if (
      !isLoading &&
      config &&
      config.userPoolId &&
      config.userPoolClientId &&
      config.identityPoolId
    ) {
      try {
        Amplify.configure({
          Auth: {
            Cognito: {
              userPoolId: config.userPoolId,
              userPoolClientId: config.userPoolClientId,
              identityPoolId: config.identityPoolId,
            },
          },
        });

        I18n.putVocabularies(translations);

        setIsConfigured(true);
      } catch (error) {
        console.error('Failed to configure Amplify:', error);
        setConfigError('Failed to configure authentication');
      }
    }
  }, [isLoading, config]);

  // Show loading while config is being fetched or Amplify is being configured
  if (isLoading || !config || !isConfigured) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white transition-colors duration-300 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Show error state if config fetch failed or Amplify configuration failed
  if (error || configError || !config) {
    return (
      <div className="flex h-dvh items-center justify-center bg-white transition-colors duration-300 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {configError ||
              'Failed to load configuration. Please refresh the page.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white transition-colors duration-300 dark:bg-gray-900">
      <ThemeProvider>
        <Authenticator
          components={{
            Header() {
              return (
                <div className="my-8 text-center">
                  <h1 className="text-3xl font-bold text-blue-600 transition-colors duration-300 dark:text-blue-400">
                    Strands Chat
                  </h1>
                </div>
              );
            },
          }}>
          {({ user }) => {
            // If user is authenticated, render children without any wrapper styling
            if (user) {
              return <>{props.children}</>;
            }

            // If user is not authenticated, this shouldn't happen as Authenticator handles it
            // But just in case, return children
            return <>{props.children}</>;
          }}
        </Authenticator>
      </ThemeProvider>
    </div>
  );
};

export default AuthWithUserPool;
