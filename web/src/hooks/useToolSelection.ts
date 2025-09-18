import { useState } from 'react';
import useChatApi from './useChatApi';
import { type ToolSelectionResponse } from '@types';

const useToolSelection = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const { selectTools: selectToolsApi } = useChatApi();

  const selectTools = async (
    prompt: string
  ): Promise<ToolSelectionResponse | null> => {
    if (!prompt.trim()) {
      return null;
    }

    try {
      setIsSelecting(true);
      const result = await selectToolsApi(prompt);
      return result;
    } catch (error) {
      console.error('Failed to select tools:', error);
      // Return conservative defaults on error
      return {
        reasoning: false,
        imageGeneration: false,
        webSearch: false,
        awsDocumentation: false,
        codeInterpreter: false,
        webBrowser: false,
      };
    } finally {
      setIsSelecting(false);
    }
  };

  return {
    selectTools,
    isSelecting,
  };
};

export default useToolSelection;
