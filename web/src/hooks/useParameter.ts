import { useContext } from 'react';
import { ParameterContext } from '../contexts/ParameterContext';
import type { ParameterContextType } from '../types/parameter';

export const useParameter = (): ParameterContextType => {
  const context = useContext(ParameterContext);
  if (context === undefined) {
    throw new Error('useParameter must be used within a ParameterProvider');
  }
  return context;
};

export default useParameter;
