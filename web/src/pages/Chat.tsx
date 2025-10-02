import { useState, useEffect, useRef } from 'react';
import useChatApi from '../hooks/useChatApi';
import useChatStream from '../hooks/useChatStream';
import useChatState from '../hooks/useChatState';
import useFile from '../hooks/useFile';
import useUser from '../hooks/useUser';
import useScreen from '../hooks/useScreen';
import useParameter from '../hooks/useParameter';
import useAutoMode from '../hooks/useAutoMode';
import useToolSelection from '../hooks/useToolSelection';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  type MessageWillBeInTable,
  type MessageShown,
  type TextContent,
  type FileContent,
  type StreamChunk,
} from '@types';
import Message from '../components/Message';
import Textarea from '../components/Textarea';
import Loading from '../components/Loading';
import ModelBottomSheet from '../components/ModelBottomSheet';
import ToolsBottomSheet from '../components/ToolsBottomSheet';
import Tooltip from '../components/Tooltip';
import { type Model } from '../types/parameter';

type ChatState = {
  newChat: boolean;
  model?: Model;
  userInput?: string;
  inputFiles?: FileContent[];
  toolsToUse?: string[];
  isAutoMode?: boolean;
};

function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams();
  const { sub } = useUser();
  const {
    screen,
    messageContainer,
    isAtBottom,
    isAtTop,
    scrollToBottom,
    scrollToTop,
    scrollBottomAnchorRef,
    scrollTopAnchorRef,
    notifyScreen,
    showScrollButton,
  } = useScreen();

  const { getMessages: getMessagesInDb } = useChatApi();
  const { postNewMessage } = useChatStream();

  const { filetype, upload, supportedExtensions } = useFile();
  const { parameter } = useParameter();
  const { isAutoMode, toggleAutoMode } = useAutoMode();
  const { selectTools, isSelecting } = useToolSelection();

  const {
    userInput,
    setUserInput,
    inputFiles,
    setInputFiles,
    toolsToUse,
    setToolsToUse,
    reasoning,
    setReasoning,
    imageGeneration,
    setImageGeneration,
    webSearch,
    setWebSearch,
    awsDocumentation,
    setAwsDocumentation,
    codeInterpreter,
    setCodeInterpreter,
    webBrowser,
    setWebBrowser,
    selectedModel,
    setSelectedModel,
    availableModels,
    messages,
    setMessages,
    getMessagesInState,
    loading,
    setLoading,
    streaming,
    setStreaming,
  } = useChatState(chatId ?? 'NEW');
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);
  const inputAreaRef = useRef<HTMLDivElement | null>(null);
  const [isModelBottomSheetOpen, setIsModelBottomSheetOpen] = useState(false);
  const [isToolsBottomSheetOpen, setIsToolsBottomSheetOpen] = useState(false);

  const initialLoad = async () => {
    if (chatId) {
      const state = location.state;

      if (state && state.newChat) {
        // Handle new chat creation with proper tool selection
        const stateTools = state.toolsToUse || [];
        const wasAutoMode = (state as ChatState & { isAutoMode?: boolean })
          ?.isAutoMode;

        setSelectedModel(state.model!);

        if (wasAutoMode) {
          // For auto mode, use the new function that handles tool selection
          executeChatStreamWithToolSelection(
            state.model!,
            state.userInput!,
            state.inputFiles || []
          );
        } else {
          // For manual mode, use existing function with predefined tools
          executeChatStream(
            state.model!,
            state.userInput!,
            state.inputFiles || [],
            stateTools
          );
          // Update component state to reflect the tools from navigation state
          setToolsToUse(stateTools);
        }

        navigate('.', { replace: true, state: undefined });
      } else {
        setLoading(true);

        try {
          const messagesInDb = await getMessagesInDb(chatId);
          const messagesInState = getMessagesInState();

          if (messagesInDb.length >= messagesInState.length) {
            setMessages(messagesInDb);
          }
        } catch (e) {
          console.error(e);
          navigate('/', { replace: true, state: undefined });
        } finally {
          setLoading(false);
        }
      }
    } else {
      setMessages([]);
      setUserInput('');
      setInputFiles([]);
      setToolsToUse([]);
    }
  };

  useEffect(() => {
    initialLoad();
    notifyScreen();
    // eslint-disable-next-line  react-hooks/exhaustive-deps
  }, [chatId]);

  const updateLastAssistantMessage = (chunk: StreamChunk) => {
    // Get the latest messages directly from store
    const currentMessages = getMessagesInState();
    const currentLastAssistantMessage = currentMessages.slice(
      currentMessages.length - 1
    )[0];
    const updatedTextContent =
      (currentLastAssistantMessage.content[0] as TextContent).text + chunk.text;
    const updatedAssistantMessage: MessageShown = {
      role: 'assistant',
      content: [
        {
          text: updatedTextContent,
        },
      ],
      resourceId: currentLastAssistantMessage.resourceId!,
    };

    // Use the current messages from store, not the stale hook value
    setMessages([
      ...currentMessages.slice(0, currentMessages.length - 1),
      updatedAssistantMessage,
    ]);
  };

  const executeChatStreamWithToolSelection = async (
    model: Model,
    userInput: string,
    inputFiles: FileContent[]
  ) => {
    // Start loading immediately for smooth UX
    setStreaming(true);

    setTimeout(() => {
      scrollToBottom();
    }, 100);

    // Determine tools to use based on mode
    let finalToolsToUse: string[] = [];

    if (isAutoMode && userInput.trim()) {
      try {
        const toolSelection = await selectTools(userInput.trim());
        if (toolSelection) {
          // Apply tool selection directly to tools array
          if (toolSelection.reasoning) finalToolsToUse.push('reasoning');
          if (toolSelection.imageGeneration)
            finalToolsToUse.push('imageGeneration');
          if (toolSelection.webSearch) finalToolsToUse.push('webSearch');
          if (toolSelection.awsDocumentation)
            finalToolsToUse.push('awsDocumentation');
          if (toolSelection.codeInterpreter)
            finalToolsToUse.push('codeInterpreter');
          if (toolSelection.webBrowser) finalToolsToUse.push('webBrowser');
        }
      } catch (error) {
        console.error('Failed to auto-select tools:', error);
        // Fall back to manual selection on error
        finalToolsToUse = [...toolsToUse];
      }
    } else {
      // Manual mode: use current state values
      finalToolsToUse = [...toolsToUse];
    }

    const newUserMessage: MessageWillBeInTable = {
      role: 'user',
      content: [
        {
          text: userInput,
        },
        ...inputFiles,
      ],
      resourceId: uuidv4(),
      tools: finalToolsToUse.length > 0 ? finalToolsToUse : null,
    };
    const newAssistantMessage: MessageWillBeInTable = {
      role: 'assistant',
      content: [
        {
          text: '',
        },
      ],
      resourceId: uuidv4(),
    };

    setMessages([...messages, newUserMessage, newAssistantMessage]);

    try {
      const stream = postNewMessage(
        chatId!,
        model.id,
        model.region,
        newUserMessage,
        newAssistantMessage
      );

      for await (const chunk of stream) {
        updateLastAssistantMessage(chunk);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStreaming(false);

      // Synchronize messages with database after streaming completes
      try {
        const messagesInDb = await getMessagesInDb(chatId!);
        const currentMessages = getMessagesInState();

        // Create a map of database messages by resourceId for efficient lookup
        const dbMessageMap = new Map(
          messagesInDb.map((msg) => [msg.resourceId, msg])
        );

        // Replace frontend messages with database versions when matches are found
        const synchronizedMessages = currentMessages.map((frontendMessage) => {
          if (
            frontendMessage.resourceId &&
            dbMessageMap.has(frontendMessage.resourceId)
          ) {
            const dbMessage = dbMessageMap.get(frontendMessage.resourceId)!;
            // Return database message with all additional fields preserved, including tools
            return {
              role: dbMessage.role,
              content: dbMessage.content,
              resourceId: dbMessage.resourceId,
              queryId: dbMessage.queryId,
              orderBy: dbMessage.orderBy,
              dataType: dbMessage.dataType,
              userId: dbMessage.userId,
              // Preserve tools from frontend message if not in database
              tools: dbMessage.tools || frontendMessage.tools,
            } as MessageShown;
          }
          return frontendMessage;
        });

        setMessages(synchronizedMessages);
      } catch (e) {
        console.error('Failed to synchronize messages with database:', e);
        // Continue with current state if synchronization fails
      }
    }
  };

  const executeChatStream = async (
    model: Model,
    userInput: string,
    inputFiles: FileContent[],
    toolsToUse: string[]
  ) => {
    setStreaming(true);

    setTimeout(() => {
      scrollToBottom();
    }, 100);

    const newUserMessage: MessageWillBeInTable = {
      role: 'user',
      content: [
        {
          text: userInput,
        },
        ...inputFiles,
      ],
      resourceId: uuidv4(),
      tools: toolsToUse.length > 0 ? toolsToUse : null,
    };
    const newAssistantMessage: MessageWillBeInTable = {
      role: 'assistant',
      content: [
        {
          text: '',
        },
      ],
      resourceId: uuidv4(),
    };

    setMessages([...messages, newUserMessage, newAssistantMessage]);

    try {
      const stream = postNewMessage(
        chatId!,
        model.id,
        model.region,
        newUserMessage,
        newAssistantMessage
      );

      for await (const chunk of stream) {
        updateLastAssistantMessage(chunk);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStreaming(false);

      // Synchronize messages with database after streaming completes
      try {
        const messagesInDb = await getMessagesInDb(chatId!);
        const currentMessages = getMessagesInState();

        // Create a map of database messages by resourceId for efficient lookup
        const dbMessageMap = new Map(
          messagesInDb.map((msg) => [msg.resourceId, msg])
        );

        // Replace frontend messages with database versions when matches are found
        const synchronizedMessages = currentMessages.map((frontendMessage) => {
          if (
            frontendMessage.resourceId &&
            dbMessageMap.has(frontendMessage.resourceId)
          ) {
            const dbMessage = dbMessageMap.get(frontendMessage.resourceId)!;
            // Return database message with all additional fields preserved, including tools
            return {
              role: dbMessage.role,
              content: dbMessage.content,
              resourceId: dbMessage.resourceId,
              queryId: dbMessage.queryId,
              orderBy: dbMessage.orderBy,
              dataType: dbMessage.dataType,
              userId: dbMessage.userId,
              // Preserve tools from frontend message if not in database
              tools: dbMessage.tools || frontendMessage.tools,
            } as MessageShown;
          }
          return frontendMessage;
        });

        setMessages(synchronizedMessages);
      } catch (e) {
        console.error('Failed to synchronize messages with database:', e);
        // Continue with current state if synchronization fails
      }
    }
  };

  const createOrContinueChat = async () => {
    if (!chatId) {
      const newChatId = uuidv4();

      navigate(`chat/${newChatId}`, {
        replace: true,
        state: {
          newChat: true,
          model: selectedModel,
          userInput,
          inputFiles,
          toolsToUse: isAutoMode ? [] : [...toolsToUse], // Pass empty array for auto mode, will be resolved later
          isAutoMode,
        } as ChatState & { isAutoMode?: boolean },
      });
    } else {
      executeChatStreamWithToolSelection(selectedModel, userInput, inputFiles);
    }

    setUserInput('');
    setInputFiles([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ?? [];

    if (files.length == 0) return;

    for (const file of files) {
      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = reader.result as string;
        const blob = await (await fetch(base64)).blob();
        const name = uuidv4();
        const extension = file.name.split('.').pop()!;
        const s3Key = await upload(`${sub}/${name}.${extension}`, blob);
        const displayName = file.name ?? name;

        setInputFiles([
          ...inputFiles,
          {
            type: filetype(file.name),
            extension,
            name,
            s3Key,
            displayName,
          },
        ]);
      };

      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  const handleFileClick = () => {
    hiddenFileInput.current?.click();
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      {/* Messages area - always present but hidden when no chatId */}
      <div
        className={`${chatId ? 'custom-scrollbar flex-1 overflow-y-auto p-4' : 'hidden'}`}
        ref={screen}>
        <div ref={scrollTopAnchorRef}></div>

        <div ref={messageContainer} className="mt-14">
          {messages.map((m, idx) => {
            return (
              <div key={idx} className="mb-12">
                <Message
                  message={m}
                  loading={
                    streaming && idx === messages.length - 1 && !isSelecting
                  }
                />
              </div>
            );
          })}
        </div>

        {loading && messages.length === 0 && <Loading className="py-14" />}

        {/* Tool selection loading indicator */}
        {isSelecting && (
          <div className="mb-12">
            <div className="w-full text-gray-900 transition-colors duration-300 dark:text-gray-100">
              <div className="flex h-8 items-center justify-center">
                <Loading size="md" />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollBottomAnchorRef}></div>
      </div>

      {/* Welcome message area - only show when no chatId */}
      {!chatId && (
        <div className="mt-14 flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 transition-colors duration-300 dark:text-blue-400">
              What's on your mind today?
            </h1>
          </div>
        </div>
      )}

      {/* Input area - always at bottom */}
      <div ref={inputAreaRef} className="relative p-4">
        {/* Scroll button */}
        {(!isAtTop || !isAtBottom) && (
          <button
            onClick={() => {
              if (isAtBottom) {
                scrollToTop();
              } else {
                scrollToBottom();
              }
            }}
            className={`absolute -top-16 right-4 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gray-800/10 text-gray-600 transition-all duration-500 hover:bg-gray-800/30 dark:bg-gray-200/30 dark:text-gray-200 dark:hover:bg-gray-200/60 ${
              isAtBottom ? 'rotate-180' : 'rotate-0'
            } ${showScrollButton ? 'opacity-100' : 'pointer-events-none opacity-0'} `}>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}

        {/* Content container */}
        <div className="flex justify-center">
          {/* Input container with max width for new chat */}

          <div className="flex w-full flex-col gap-2 rounded border border-gray-300 p-2 lg:flex-col dark:border-gray-600">
            {/* File attachments - show above input area */}
            {inputFiles.length > 0 && (
              <div className="mb-2">
                {inputFiles.map((f, idx) => {
                  return (
                    <div
                      key={idx}
                      className="mb-2 flex items-center justify-between rounded bg-gray-100 p-1 text-sm text-gray-900 transition-colors duration-300 dark:bg-gray-700 dark:text-gray-100">
                      <span className="transition-colors duration-300">
                        {f.displayName}
                      </span>
                      <button
                        className="cursor-pointer rounded p-1 text-gray-600 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:text-gray-300 dark:hover:bg-gray-600 dark:active:bg-gray-500"
                        onClick={() => {
                          setInputFiles(
                            inputFiles.filter((ff) => ff.s3Key !== f.s3Key)
                          );
                        }}>
                        <svg
                          className="h-4 w-4 transition-colors duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Textarea */}
            <div className="mb-2">
              <Textarea
                onChange={setUserInput}
                value={userInput}
                onEnter={() => {
                  if (
                    loading ||
                    streaming ||
                    isSelecting ||
                    userInput.trim().length === 0
                  )
                    return;
                  createOrContinueChat();
                }}
              />
            </div>

            {/* Buttons - unified for both mobile and desktop */}
            <div className="flex items-center gap-2">
              <Tooltip content="File Attachment">
                <button
                  className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${inputFiles.length > 0 ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                  onClick={handleFileClick}>
                  <svg
                    className="h-5 w-5 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
              </Tooltip>

              {/* AUTO/MANUAL Mode Toggle Switch */}
              <Tooltip
                content={
                  isAutoMode
                    ? 'Auto Mode (AI selects tools)'
                    : 'Manual Mode (Select tools manually)'
                }>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAutoMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800 ${
                      isAutoMode
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
                    }`}>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        isAutoMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-medium transition-colors duration-200 ${isAutoMode ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    AUTO
                  </span>
                </div>
              </Tooltip>

              {/* Desktop: Individual toggle buttons */}
              <div
                className={`${isAutoMode ? 'hidden' : 'hidden lg:flex lg:gap-2'}`}>
                {/* Reasoning toggle button */}
                <Tooltip content="Reasoning">
                  <button
                    className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${reasoning ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                    onClick={() => setReasoning(!reasoning)}>
                    <svg
                      className="h-5 w-5 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </button>
                </Tooltip>

                <Tooltip content="Image Generation">
                  <button
                    className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${imageGeneration ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                    onClick={() => setImageGeneration(!imageGeneration)}>
                    <svg
                      className="h-5 w-5 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </Tooltip>

                {/* AWS Document toggle button */}
                <Tooltip content="AWS Documentation">
                  <button
                    className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${awsDocumentation ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                    onClick={() => setAwsDocumentation(!awsDocumentation)}>
                    <svg
                      className="h-5 w-5 transition-colors duration-300"
                      viewBox="0 0 300.73 179.82"
                      fill="currentColor">
                      <path d="M84.74,65.27c0,3.74.38,6.71,1.14,8.92.76,2.22,1.84,4.61,3.24,7.18.46.82.7,1.57.7,2.27,0,1.05-.64,2.04-1.93,2.98l-6.3,4.2c-.93.58-1.81.88-2.62.88-1.05,0-2.04-.46-2.97-1.4-1.4-1.4-2.6-2.95-3.59-4.64-.99-1.69-2.01-3.64-3.06-5.86-7.82,9.22-17.62,13.83-29.4,13.83-8.4,0-15.05-2.39-19.95-7.18-4.9-4.78-7.35-11.2-7.35-19.25,0-8.51,3.03-15.37,9.1-20.56,6.06-5.19,14.23-7.79,24.5-7.79,3.38,0,6.91.26,10.59.79,3.68.53,7.5,1.26,11.46,2.19v-7.35c0-7.58-1.58-12.92-4.72-16.01-3.15-3.09-8.58-4.64-16.28-4.64-3.5,0-7.09.44-10.76,1.31-3.67.88-7.26,2.01-10.76,3.41-1.63.7-2.8,1.14-3.5,1.31-.7.17-1.22.26-1.57.26-1.4,0-2.1-1.05-2.1-3.15v-4.9c0-1.63.23-2.8.7-3.5.46-.7,1.4-1.4,2.8-2.1,3.5-1.75,7.7-3.26,12.6-4.55,4.9-1.28,10.09-1.93,15.57-1.93,11.9,0,20.62,2.71,26.16,8.14,5.54,5.42,8.31,13.62,8.31,24.59v32.55ZM44.14,80.5c3.27,0,6.71-.61,10.33-1.84,3.62-1.22,6.76-3.35,9.45-6.39,1.63-1.86,2.77-4,3.41-6.39.64-2.39.96-5.28.96-8.66v-4.2c-2.92-.7-5.98-1.25-9.19-1.66-3.21-.41-6.33-.61-9.36-.61-6.65,0-11.61,1.34-14.88,4.02-3.27,2.69-4.9,6.54-4.9,11.55,0,4.67,1.23,8.2,3.67,10.59,2.45,2.39,5.95,3.59,10.5,3.59ZM124.47,91.35c-1.75,0-3.04-.32-3.85-.96-.82-.64-1.52-1.95-2.1-3.94L95.07,9.1c-.59-1.98-.87-3.33-.87-4.02,0-1.63.81-2.45,2.45-2.45h9.8c1.86,0,3.18.32,3.94.96.76.64,1.43,1.96,2.01,3.94l16.8,66.15,15.57-66.15c.46-1.98,1.11-3.29,1.93-3.94.81-.64,2.16-.96,4.02-.96h8.05c1.87,0,3.21.32,4.03.96.81.64,1.46,1.96,1.92,3.94l15.75,67.03L197.79,7.52c.58-1.98,1.25-3.29,2.01-3.94.76-.64,2.07-.96,3.94-.96h9.27c1.63,0,2.45.82,2.45,2.45,0,.47-.06.99-.17,1.57-.12.59-.35,1.4-.7,2.45l-24.15,77.35c-.59,1.99-1.29,3.3-2.1,3.94-.82.64-2.1.96-3.85.96h-8.58c-1.87,0-3.21-.35-4.03-1.05-.82-.7-1.46-2.04-1.92-4.03l-15.58-64.4-15.4,64.4c-.47,1.99-1.11,3.33-1.92,4.03-.82.7-2.16,1.05-4.03,1.05h-8.58ZM252.92,93.98c-5.25,0-10.38-.58-15.4-1.75-5.02-1.16-8.87-2.51-11.55-4.03-1.63-.93-2.66-1.86-3.06-2.8-.41-.93-.61-1.86-.61-2.8v-5.08c0-2.1.76-3.15,2.28-3.15.58,0,1.19.12,1.84.35.64.24,1.49.59,2.54,1.05,3.38,1.52,7.06,2.69,11.02,3.5,3.96.82,7.93,1.23,11.9,1.23,6.3,0,11.17-1.11,14.61-3.33,3.44-2.21,5.16-5.37,5.16-9.45,0-2.8-.9-5.13-2.71-7-1.81-1.87-5.16-3.62-10.06-5.25l-14.53-4.55c-7.35-2.33-12.69-5.71-16.01-10.15-3.32-4.43-4.99-9.27-4.99-14.52,0-4.2.9-7.9,2.71-11.11,1.81-3.21,4.2-5.95,7.17-8.23,2.97-2.27,6.45-4,10.41-5.16,3.96-1.16,8.16-1.75,12.6-1.75,2.21,0,4.46.15,6.74.44,2.28.29,4.43.67,6.47,1.14,2.04.47,3.94.99,5.69,1.57,1.75.59,3.15,1.17,4.2,1.75,1.4.82,2.39,1.64,2.98,2.45.58.82.87,1.92.87,3.33v4.72c0,2.1-.76,3.15-2.28,3.15-.82,0-2.1-.41-3.85-1.23-5.72-2.56-12.14-3.85-19.25-3.85-5.72,0-10.15.94-13.3,2.8-3.15,1.87-4.72,4.84-4.72,8.93,0,2.8.99,5.16,2.97,7.09,1.98,1.92,5.66,3.76,11.03,5.51l14.17,4.55c7.23,2.34,12.4,5.54,15.49,9.63,3.09,4.08,4.64,8.75,4.64,14,0,4.32-.87,8.2-2.62,11.64-1.75,3.44-4.17,6.39-7.26,8.84-3.09,2.45-6.8,4.32-11.11,5.6-4.32,1.28-9.04,1.92-14.17,1.92ZM267.05,134.91c-36.91,15.66-77.03,23.23-113.52,23.23-54.1,0-106.47-14.84-148.82-39.49-3.71-2.16-6.45,1.65-3.37,4.43,39.26,35.45,91.13,56.74,148.74,56.74,41.1,0,88.84-12.92,121.76-37.22,5.45-4.03.78-10.05-4.79-7.69ZM276.87,164.5c-1.2,3,1.38,4.21,4.1,1.94,17.66-14.78,22.23-45.74,18.61-50.21-3.59-4.43-34.47-8.25-53.32,4.98-2.9,2.03-2.4,4.84.82,4.46,10.62-1.27,34.24-4.11,38.45,1.28,4.22,5.4-4.68,27.62-8.66,37.54Z" />
                    </svg>
                  </button>
                </Tooltip>

                {/* Web Search toggle button - only show if parameter.webSearch is true */}
                {parameter.webSearch && (
                  <Tooltip content="Web Search">
                    <button
                      className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${webSearch ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                      onClick={() => setWebSearch(!webSearch)}>
                      <svg
                        className="h-5 w-5 transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </Tooltip>
                )}

                <Tooltip content="Web Browser">
                  <button
                    className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${webBrowser ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                    onClick={() => setWebBrowser(!webBrowser)}>
                    <svg
                      className="h-5 w-5 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </button>
                </Tooltip>

                <Tooltip content="Code Interpreter">
                  <button
                    className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none ${codeInterpreter ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'}`}
                    onClick={() => setCodeInterpreter(!codeInterpreter)}>
                    <svg
                      className="h-5 w-5 transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </Tooltip>
              </div>

              {/* Mobile: Tools button */}
              {!isAutoMode && (
                <button
                  className={`cursor-pointer rounded p-2 transition-colors duration-300 focus:outline-none lg:hidden ${
                    reasoning ||
                    imageGeneration ||
                    awsDocumentation ||
                    codeInterpreter ||
                    webBrowser ||
                    (parameter.webSearch && webSearch)
                      ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800'
                      : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600'
                  }`}
                  onClick={() => setIsToolsBottomSheetOpen(true)}>
                  <svg
                    className="h-5 w-5 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}

              {/* Model selector button - mobile only with gradient border */}
              <button
                className="relative flex cursor-pointer items-center rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px] text-xs transition-all duration-300 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none active:from-blue-700 active:via-purple-700 active:to-pink-700 lg:hidden"
                onClick={() => setIsModelBottomSheetOpen(true)}>
                <span className="flex items-center rounded-full bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors duration-300 hover:bg-gray-50 active:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600">
                  {selectedModel.displayName}
                </span>
              </button>

              <button
                className="ml-auto cursor-pointer rounded bg-blue-500 p-2 text-white transition-colors duration-300 hover:bg-blue-600 focus:outline-none active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 dark:active:bg-blue-800 dark:disabled:hover:bg-blue-600"
                onClick={createOrContinueChat}
                disabled={
                  loading ||
                  streaming ||
                  isSelecting ||
                  userInput.trim().length === 0
                }>
                <svg
                  className="h-5 w-5 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>

          <input
            ref={hiddenFileInput}
            type="file"
            accept={supportedExtensions.join(',')}
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
        </div>
      </div>

      {/* Model Bottom Sheet - mobile only */}
      <ModelBottomSheet
        isOpen={isModelBottomSheetOpen}
        onClose={() => setIsModelBottomSheetOpen(false)}
        selectedModel={selectedModel}
        models={availableModels}
        onModelChange={setSelectedModel}
      />

      {/* Tools Bottom Sheet - mobile only */}
      <ToolsBottomSheet
        isOpen={isToolsBottomSheetOpen}
        onClose={() => setIsToolsBottomSheetOpen(false)}
        reasoning={reasoning}
        onReasoningChange={setReasoning}
        imageGeneration={imageGeneration}
        onImageGenerationChange={setImageGeneration}
        awsDocumentation={awsDocumentation}
        onAwsDocumentationChange={setAwsDocumentation}
        webSearch={webSearch}
        onWebSearchChange={setWebSearch}
        showWebSearch={parameter.webSearch}
        codeInterpreter={codeInterpreter}
        onCodeInterpreterChange={setCodeInterpreter}
        webBrowser={webBrowser}
        onWebBrowserChange={setWebBrowser}
      />
    </div>
  );
}
export default Chat;
