import { Link } from 'react-router-dom';
import { useRef, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import useUser from '../hooks/useUser';
import useChats from '../hooks/useChats';
import Tooltip from './Tooltip';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function Drawer({ isOpen, onClose }: DrawerProps) {
  const { email } = useUser();
  const { signOut } = useAuthenticator();
  const { chats, canLoadMore, loadMore, isLoading } = useChats();
  const { chatId } = useParams();
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const SkeletonItem = () => (
    <div className="mb-2 cursor-pointer rounded p-2 transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700">
      <div className="block">
        <div className="h-5 animate-pulse rounded bg-gray-300 text-sm transition-colors duration-300 dark:bg-gray-600"></div>
      </div>
    </div>
  );

  const handleDesktopScroll = useCallback(() => {
    const container = desktopScrollRef.current;
    if (!container || !canLoadMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMore();
    }
  }, [canLoadMore, isLoading, loadMore]);

  const handleMobileScroll = useCallback(() => {
    const container = mobileScrollRef.current;
    if (!container || !canLoadMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 100;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadMore();
    }
  }, [canLoadMore, isLoading, loadMore]);

  useEffect(() => {
    const container = desktopScrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleDesktopScroll);
    return () => container.removeEventListener('scroll', handleDesktopScroll);
  }, [handleDesktopScroll]);

  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleMobileScroll);
    return () => container.removeEventListener('scroll', handleMobileScroll);
  }, [handleMobileScroll]);

  const loadCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadAttempts = 5;

  useEffect(() => {
    const checkAndLoadMore = async () => {
      if (loadCountRef.current >= maxLoadAttempts) return;

      if (chats.length > 0 && canLoadMore && !isLoading) {
        const desktopContainer = desktopScrollRef.current;
        const mobileContainer = mobileScrollRef.current;

        const activeContainer = desktopContainer?.offsetParent
          ? desktopContainer
          : mobileContainer;

        if (
          activeContainer &&
          activeContainer.scrollHeight <= activeContainer.clientHeight
        ) {
          loadCountRef.current++;
          await loadMore();
          timeoutRef.current = setTimeout(checkAndLoadMore, 200);
        }
      }
    };

    if (chats.length > 0) {
      timeoutRef.current = setTimeout(checkAndLoadMore, 200);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [chats.length, canLoadMore, isLoading, loadMore]);

  useEffect(() => {
    if (chats.length === 0) {
      loadCountRef.current = 0;
    }
  }, [chats.length]);

  const handleChatClick = () => {
    onClose();
  };

  const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
      <button
        onClick={toggleTheme}
        className="flex cursor-pointer items-center rounded p-1 text-gray-700 transition-colors duration-300 hover:text-gray-900 focus:outline-none active:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 dark:active:text-gray-200"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
        {theme === 'light' ? (
          <svg
            className="h-6 w-6 transition-colors duration-300"
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
          <svg
            className="h-6 w-6 transition-colors duration-300"
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
    );
  };

  return (
    <>
      <div className="hidden w-64 flex-col pt-14 transition-colors duration-300 lg:flex">
        <div ref={desktopScrollRef} className="flex-1 overflow-y-auto p-4">
          {chats.map((c, idx) => {
            const isSelected = c.resourceId === chatId;
            return (
              <Link
                to={`/chat/${c.resourceId}`}
                className={`mb-2 block cursor-pointer rounded p-2 transition-colors duration-300 ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 focus:outline-none active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600'
                }`}
                key={idx}>
                <div
                  className={`truncate text-sm transition-colors duration-300 ${
                    isSelected
                      ? 'font-medium text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                  {c.title}
                </div>
              </Link>
            );
          })}

          {isLoading && (
            <>
              {Array.from({ length: 20 }).map((_, idx) => (
                <SkeletonItem key={`skeleton-${idx}`} />
              ))}
            </>
          )}
        </div>

        <div className="mx-4 flex items-center justify-between border-t border-gray-200 pt-2 pb-4 dark:border-gray-700">
          <span className="truncate text-sm text-gray-600 dark:text-gray-300">
            {email}
          </span>
          <button
            onClick={signOut}
            className="flex cursor-pointer items-center rounded-md p-2 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600">
            <svg
              className="h-5 w-5 text-gray-600 transition-colors duration-300 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-white transition-all duration-300 ease-in-out lg:hidden dark:bg-gray-900 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tooltip content="New chat" position="bottom">
              <Link
                to="/"
                className="flex items-center rounded p-1 text-gray-700 transition-colors duration-300 hover:text-gray-900 focus:outline-none active:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 dark:active:text-gray-200"
                onClick={handleChatClick}>
                <svg
                  className="h-6 w-6 transition-colors duration-300"
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
                className="flex items-center rounded p-1 text-gray-700 transition-colors duration-300 hover:text-gray-900 focus:outline-none active:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 dark:active:text-gray-200"
                onClick={handleChatClick}>
                <svg
                  className="h-6 w-6 transition-colors duration-300"
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
          <ThemeToggle />
        </div>

        <div
          ref={mobileScrollRef}
          className="min-h-0 flex-1 overflow-y-auto p-4">
          {chats.map((c, idx) => {
            const isSelected = c.resourceId === chatId;
            return (
              <Link
                to={`/chat/${c.resourceId}`}
                className={`mb-2 block cursor-pointer rounded p-2 transition-colors duration-300 ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 focus:outline-none active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600'
                }`}
                key={idx}
                onClick={handleChatClick}>
                <div
                  className={`truncate text-sm transition-colors duration-300 ${
                    isSelected
                      ? 'font-medium text-blue-900 dark:text-blue-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                  {c.title}
                </div>
              </Link>
            );
          })}

          {isLoading && (
            <>
              {Array.from({ length: 20 }).map((_, idx) => (
                <SkeletonItem key={`skeleton-${idx}`} />
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <span className="truncate text-sm text-gray-600 dark:text-gray-300">
            {email}
          </span>
          <button
            onClick={signOut}
            className="flex cursor-pointer items-center rounded-md p-2 transition-colors duration-300 hover:bg-gray-200 focus:outline-none active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600">
            <svg
              className="h-5 w-5 text-gray-600 transition-colors duration-300 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default Drawer;
