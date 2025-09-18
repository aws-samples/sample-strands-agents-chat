import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useCallback } from 'react';
import { type FileContent, type MessageShown } from '@types';
import { type Model } from '../types/parameter';
import useParameter from './useParameter';

export type ChatState = {
  userInput: string;
  inputFiles: FileContent[];
  toolsToUse: string[];
  selectedModel: Model | null;
  messages: MessageShown[];
  loading: boolean;
  streaming: boolean;
};

const DEFAULT_CHAT_STATE: ChatState = {
  userInput: '',
  inputFiles: [],
  toolsToUse: [],
  selectedModel: null,
  messages: [],
  loading: false,
  streaming: false,
};

type Store = {
  chats: Record<string, ChatState>;
  setUserInput: (chatId: string, userInput: string) => void;
  setInputFiles: (chatId: string, inputFiles: FileContent[]) => void;
  setToolsToUse: (chatId: string, toolsToUse: string[]) => void;
  setSelectedModel: (chatId: string, model: Model) => void;
  setMessages: (chatId: string, messages: MessageShown[]) => void;
  setLoading: (chatId: string, loading: boolean) => void;
  setStreaming: (chatId: string, streaming: boolean) => void;
};

const useChatStore = create<Store>()(
  persist(
    immer((set) => ({
      chats: {},
      setUserInput: (chatId: string, userInput: string) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.userInput = userInput;
        }),
      setInputFiles: (chatId: string, inputFiles: FileContent[]) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.inputFiles = inputFiles;
        }),
      setToolsToUse: (chatId: string, toolsToUse: string[]) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.toolsToUse = toolsToUse;
        }),
      setSelectedModel: (chatId: string, model: Model) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.selectedModel = model;
        }),
      setMessages: (chatId: string, messages: MessageShown[]) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.messages = messages;
        }),
      setLoading: (chatId: string, loading: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.loading = loading;
        }),
      setStreaming: (chatId: string, streaming: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.streaming = streaming;
        }),
    })),
    {
      name: 'chat-state-storage',
      storage: {
        getItem: (name: string) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name: string, value: unknown) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

const useChatState = (chatId: string) => {
  const state = useChatStore(
    useShallow((s) => s.chats[chatId] ?? DEFAULT_CHAT_STATE)
  );
  const { parameter } = useParameter();
  const setUserInputImpl = useChatStore((s) => s.setUserInput);
  const setInputFilesImpl = useChatStore((s) => s.setInputFiles);
  const setToolsToUseImpl = useChatStore((s) => s.setToolsToUse);
  const setSelectedModelImpl = useChatStore((s) => s.setSelectedModel);
  const setMessagesImpl = useChatStore((s) => s.setMessages);
  const setLoadingImpl = useChatStore((s) => s.setLoading);
  const setStreamingImpl = useChatStore((s) => s.setStreaming);

  // Get available models from parameter (always available with Suspense)
  const availableModels = parameter.models;

  // Check if the current selected model is valid
  const isValidModel = useCallback(
    (model: Model | null): boolean => {
      if (!model) return false;
      return availableModels.some(
        (availableModel) => availableModel.id === model.id
      );
    },
    [availableModels]
  );

  // Get the current selected model or fallback to first available
  let selectedModel = state.selectedModel;

  // Use useEffect to update the store when model is invalid or missing
  useEffect(() => {
    if (!isValidModel(selectedModel) && availableModels.length > 0) {
      setSelectedModelImpl(chatId, availableModels[0]);
    }
  }, [
    chatId,
    selectedModel,
    availableModels,
    setSelectedModelImpl,
    isValidModel,
  ]);

  // For immediate rendering, use fallback if current model is invalid
  if (!isValidModel(selectedModel) && availableModels.length > 0) {
    selectedModel = availableModels[0];
  }

  // Helper functions for tool management
  const currentTools = state.toolsToUse || [];
  const hasReasoning = currentTools.includes('reasoning');
  const hasImageGeneration = currentTools.includes('imageGeneration');
  const hasWebSearch = currentTools.includes('webSearch');
  const hasAwsDocumentation = currentTools.includes('awsDocumentation');
  const hasCodeInterpreter = currentTools.includes('codeInterpreter');
  const hasWebBrowser = currentTools.includes('webBrowser');

  const toggleTool = useCallback(
    (toolName: string) => {
      const currentTools = state.toolsToUse || [];
      const newTools = currentTools.includes(toolName)
        ? currentTools.filter((tool) => tool !== toolName)
        : [...currentTools, toolName];
      setToolsToUseImpl(chatId, newTools);
    },
    [chatId, state.toolsToUse, setToolsToUseImpl]
  );

  // Add a function to get current messages directly from store
  const getMessagesInState = useCallback(() => {
    return useChatStore.getState().chats[chatId]?.messages ?? [];
  }, [chatId]);

  return {
    userInput: state.userInput,
    setUserInput: (userInput: string) => setUserInputImpl(chatId, userInput),
    inputFiles: state.inputFiles,
    setInputFiles: (inputFiles: FileContent[]) =>
      setInputFilesImpl(chatId, inputFiles),
    toolsToUse: state.toolsToUse || [],
    setToolsToUse: (tools: string[]) => setToolsToUseImpl(chatId, tools),
    toggleTool,
    // Helper boolean getters for backward compatibility
    reasoning: hasReasoning,
    setReasoning: (enabled: boolean) => {
      const currentTools = state.toolsToUse || [];
      const hasThisTool = currentTools.includes('reasoning');
      if (enabled && !hasThisTool) {
        setToolsToUseImpl(chatId, [...currentTools, 'reasoning']);
      } else if (!enabled && hasThisTool) {
        setToolsToUseImpl(
          chatId,
          currentTools.filter((tool) => tool !== 'reasoning')
        );
      }
    },
    imageGeneration: hasImageGeneration,
    setImageGeneration: (enabled: boolean) => {
      const currentTools = state.toolsToUse || [];
      const hasThisTool = currentTools.includes('imageGeneration');
      if (enabled && !hasThisTool) {
        setToolsToUseImpl(chatId, [...currentTools, 'imageGeneration']);
      } else if (!enabled && hasThisTool) {
        setToolsToUseImpl(
          chatId,
          currentTools.filter((tool) => tool !== 'imageGeneration')
        );
      }
    },
    webSearch: hasWebSearch,
    setWebSearch: (enabled: boolean) => {
      const currentTools = state.toolsToUse || [];
      const hasThisTool = currentTools.includes('webSearch');
      if (enabled && !hasThisTool) {
        setToolsToUseImpl(chatId, [...currentTools, 'webSearch']);
      } else if (!enabled && hasThisTool) {
        setToolsToUseImpl(
          chatId,
          currentTools.filter((tool) => tool !== 'webSearch')
        );
      }
    },
    awsDocumentation: hasAwsDocumentation,
    setAwsDocumentation: (enabled: boolean) => {
      const currentTools = state.toolsToUse || [];
      const hasThisTool = currentTools.includes('awsDocumentation');
      if (enabled && !hasThisTool) {
        setToolsToUseImpl(chatId, [...currentTools, 'awsDocumentation']);
      } else if (!enabled && hasThisTool) {
        setToolsToUseImpl(
          chatId,
          currentTools.filter((tool) => tool !== 'awsDocumentation')
        );
      }
    },
    codeInterpreter: hasCodeInterpreter,
    setCodeInterpreter: (enabled: boolean) => {
      const currentTools = state.toolsToUse || [];
      const hasThisTool = currentTools.includes('codeInterpreter');
      if (enabled && !hasThisTool) {
        setToolsToUseImpl(chatId, [...currentTools, 'codeInterpreter']);
      } else if (!enabled && hasThisTool) {
        setToolsToUseImpl(
          chatId,
          currentTools.filter((tool) => tool !== 'codeInterpreter')
        );
      }
    },
    webBrowser: hasWebBrowser,
    setWebBrowser: (enabled: boolean) => {
      const currentTools = state.toolsToUse || [];
      const hasThisTool = currentTools.includes('webBrowser');
      if (enabled && !hasThisTool) {
        setToolsToUseImpl(chatId, [...currentTools, 'webBrowser']);
      } else if (!enabled && hasThisTool) {
        setToolsToUseImpl(
          chatId,
          currentTools.filter((tool) => tool !== 'webBrowser')
        );
      }
    },
    selectedModel: selectedModel!,
    setSelectedModel: (model: Model) => setSelectedModelImpl(chatId, model),
    availableModels,
    messages: state.messages,
    setMessages: (messages: MessageShown[]) =>
      setMessagesImpl(chatId, messages),
    getMessagesInState,
    loading: state.loading,
    setLoading: (loading: boolean) => setLoadingImpl(chatId, loading),
    streaming: state.streaming,
    setStreaming: (streaming: boolean) => setStreamingImpl(chatId, streaming),
  };
};

export default useChatState;
