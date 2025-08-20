import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useCallback } from 'react';
import { type FileContent } from '@types';
import { type Model } from '../types/parameter';
import useParameter from './useParameter';

export type ChatState = {
  userInput: string;
  inputFiles: FileContent[];
  reasoning: boolean;
  imageGeneration: boolean;
  webSearch: boolean;
  awsDocumentation: boolean;
  codeInterpreter: boolean;
  webBrowser: boolean;
  selectedModel: Model | null;
};

const DEFAULT_CHAT_STATE: ChatState = {
  userInput: '',
  inputFiles: [],
  reasoning: false,
  imageGeneration: false,
  webSearch: false,
  awsDocumentation: false,
  codeInterpreter: false,
  webBrowser: false,
  selectedModel: null,
};

type Store = {
  chats: Record<string, ChatState>;
  setUserInput: (chatId: string, userInput: string) => void;
  setInputFiles: (chatId: string, inputFiles: FileContent[]) => void;
  setReasoning: (chatId: string, reasoning: boolean) => void;
  setImageGeneration: (chatId: string, imageGeneration: boolean) => void;
  setWebSearch: (chatId: string, webSearch: boolean) => void;
  setAwsDocumentation: (chatId: string, awsDocumentation: boolean) => void;
  setCodeInterpreter: (chatId: string, codeInterpreter: boolean) => void;
  setWebBrowser: (chatId: string, webBrowser: boolean) => void;
  setSelectedModel: (chatId: string, model: Model) => void;
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
      setReasoning: (chatId: string, reasoning: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.reasoning = reasoning;
        }),
      setImageGeneration: (chatId: string, imageGeneration: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.imageGeneration = imageGeneration;
        }),
      setWebSearch: (chatId: string, webSearch: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.webSearch = webSearch;
        }),
      setAwsDocumentation: (chatId: string, awsDocumentation: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.awsDocumentation = awsDocumentation;
        }),
      setCodeInterpreter: (chatId: string, codeInterpreter: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.codeInterpreter = codeInterpreter;
        }),
      setWebBrowser: (chatId: string, webBrowser: boolean) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.webBrowser = webBrowser;
        }),
      setSelectedModel: (chatId: string, model: Model) =>
        set((s) => {
          const curr =
            s.chats[chatId] ?? (s.chats[chatId] = { ...DEFAULT_CHAT_STATE });
          curr.selectedModel = model;
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
  const setReasoningImpl = useChatStore((s) => s.setReasoning);
  const setImageGenerationImpl = useChatStore((s) => s.setImageGeneration);
  const setWebSearchImpl = useChatStore((s) => s.setWebSearch);
  const setAwsDocumentImpl = useChatStore((s) => s.setAwsDocumentation);
  const setCodeInterpreterImpl = useChatStore((s) => s.setCodeInterpreter);
  const setWebBrowserImpl = useChatStore((s) => s.setWebBrowser);
  const setSelectedModelImpl = useChatStore((s) => s.setSelectedModel);

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

  return {
    userInput: state.userInput,
    setUserInput: (userInput: string) => setUserInputImpl(chatId, userInput),
    inputFiles: state.inputFiles,
    setInputFiles: (inputFiles: FileContent[]) =>
      setInputFilesImpl(chatId, inputFiles),
    reasoning: state.reasoning,
    setReasoning: (reasoning: boolean) => setReasoningImpl(chatId, reasoning),
    imageGeneration: state.imageGeneration,
    setImageGeneration: (imageGeneration: boolean) =>
      setImageGenerationImpl(chatId, imageGeneration),
    webSearch: state.webSearch,
    setWebSearch: (webSearch: boolean) => setWebSearchImpl(chatId, webSearch),
    awsDocumentation: state.awsDocumentation,
    setAwsDocumentation: (awsDocumentation: boolean) =>
      setAwsDocumentImpl(chatId, awsDocumentation),
    codeInterpreter: state.codeInterpreter,
    setCodeInterpreter: (codeInterpreter: boolean) =>
      setCodeInterpreterImpl(chatId, codeInterpreter),
    webBrowser: state.webBrowser,
    setWebBrowser: (webBrowser: boolean) =>
      setWebBrowserImpl(chatId, webBrowser),
    selectedModel: selectedModel!,
    setSelectedModel: (model: Model) => setSelectedModelImpl(chatId, model),
    availableModels,
  };
};

export default useChatState;
