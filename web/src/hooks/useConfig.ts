import { useContext } from 'react';
import { ConfigContext } from '../contexts/ConfigContext';
import type { ConfigContextType } from '../types/config';

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export default useConfig;
