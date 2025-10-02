import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import type { ChatInTable } from '@types';
import useChatState from '../hooks/useChatState';
import ModelDropdown from './ModelDropdown';
import Tooltip from './Tooltip';

interface HeaderProps {
  onToggleDrawer: () => void;
}

function Header({ onToggleDrawer }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { chatId } = useParams();
  const { swrFetcher } = useApi();
  const { data: chat } = useSWR(
    chatId ? `chat/${chatId}` : null,
    swrFetcher<ChatInTable | null>
  );
  const { selectedModel, setSelectedModel, availableModels } = useChatState(
    chatId ?? 'NEW'
  );

  return (
    <div className="fixed top-0 right-0 left-0 z-1 flex h-14 items-center bg-white/80 px-4 py-2 backdrop-blur-xs transition-colors duration-300 dark:bg-gray-900/80">
      <button
        onClick={onToggleDrawer}
        className="mr-4 flex cursor-pointer items-center rounded-md p-2 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 lg:hidden dark:hover:bg-gray-700 dark:active:bg-gray-600">
        <svg
          className="h-6 w-6 text-gray-600 transition-colors duration-300 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div className="hidden flex-1 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Tooltip content="New chat" position="bottom">
              <Link
                to="/"
                className="flex items-center rounded-md p-2 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600">
                <svg
                  className="h-6 w-6 text-gray-600 transition-colors duration-300 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v8m-4-4h8"
                  />
                </svg>
              </Link>
            </Tooltip>
            <Tooltip content="Gallery" position="bottom">
              <Link
                to="/gallery"
                className="flex items-center rounded-md p-2 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600">
                <svg
                  className="h-6 w-6 text-gray-600 transition-colors duration-300 dark:text-gray-300"
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
              </Link>
            </Tooltip>
          </div>
          <ModelDropdown
            selectedModel={selectedModel}
            models={availableModels}
            onModelChange={setSelectedModel}
          />
        </div>
      </div>

      <div className="mr-12 flex flex-1 justify-center lg:mr-0">
        <h1 className="truncate text-lg font-bold text-gray-800 transition-colors duration-300 dark:text-gray-200">
          {chat ? <>{chat.title}</> : <></>}
        </h1>
      </div>

      <div className="hidden flex-1 justify-end lg:flex">
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleTheme}
            className="flex cursor-pointer items-center rounded-md p-2 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? (
              // Moon icon for light mode (clicking will switch to dark)
              <svg
                className="h-5 w-5 text-gray-600 transition-colors duration-300 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              // Sun icon for dark mode (clicking will switch to light)
              <svg
                className="h-5 w-5 text-gray-600 transition-colors duration-300 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;
