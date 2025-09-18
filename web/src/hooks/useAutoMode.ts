import { useState, useEffect } from 'react';

const AUTO_MODE_STORAGE_KEY = 'tool-selection-auto-mode';

const useAutoMode = () => {
  const [isAutoMode, setIsAutoMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTO_MODE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false; // Default to manual mode
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_MODE_STORAGE_KEY, JSON.stringify(isAutoMode));
    } catch {
      // localStorage might be unavailable
    }
  }, [isAutoMode]);

  const toggleAutoMode = () => {
    setIsAutoMode((prev) => !prev);
  };

  return {
    isAutoMode,
    setIsAutoMode,
    toggleAutoMode,
  };
};

export default useAutoMode;
