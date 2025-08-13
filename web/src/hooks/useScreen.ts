import { useEffect, useRef, useCallback, useState } from 'react';

const useScreen = () => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [following, setFollowing] = useState(false);

  const screen = useRef<HTMLDivElement>(null);
  const messageContainer = useRef<HTMLDivElement>(null);
  const scrollButtonTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // A function to notify when the screen size or position changes
  // It is called when the screen is initially loaded and when scrolling
  // When the chat elements are loaded, the screen is automatically scrolled to the bottom, so it is also called there
  const notifyScreen = useCallback(() => {
    const div = screen.current;

    if (!div) return;

    if (scrollButtonTimeoutRef.current) {
      clearTimeout(scrollButtonTimeoutRef.current);
    }

    setShowScrollButton(true);

    scrollButtonTimeoutRef.current = setTimeout(() => {
      setShowScrollButton(false);
    }, 3000);

    // When the bottom is reached, set isAtBottom to true
    // Because the decimal point may be omitted, 1.0 is provided as a margin
    if (div.clientHeight + div.scrollTop + 10.0 >= div.scrollHeight) {
      setIsAtBottom(true);
    } else {
      setIsAtBottom(false);
    }

    // When the top is reached, set isAtTop to true
    // Because the decimal point may be omitted, 1.0 is provided as a margin
    if (div.scrollTop <= 10.0) {
      setIsAtTop(true);
    } else {
      setIsAtTop(false);
    }
  }, [setIsAtBottom, setIsAtTop, screen]);

  // When the screen is set, set the scroll event listener
  useEffect(() => {
    const current = screen.current;

    if (!current) return;

    const handleScrollInner = () => {
      notifyScreen();
    };

    current.addEventListener('scroll', handleScrollInner);
    notifyScreen();

    return () => {
      current.removeEventListener('scroll', handleScrollInner);
    };
  }, [screen, notifyScreen]);

  const scrollTopAnchorRef = useRef<HTMLDivElement | null>(null);
  const scrollBottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFollowing(isAtBottom);
  }, [isAtBottom, setFollowing]);

  const scrollToBottom = useCallback(() => {
    if (scrollBottomAnchorRef.current) {
      scrollBottomAnchorRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollTopAnchorRef.current) {
      scrollTopAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const current = messageContainer.current;

    if (!current) return;

    const observer = new ResizeObserver(() => {
      if (following) {
        scrollToBottom();
      }
    });

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, [messageContainer, scrollToBottom, following]);

  return {
    screen,
    notifyScreen,
    messageContainer,
    isAtBottom,
    isAtTop,
    setIsAtBottom,
    setIsAtTop,
    scrollTopAnchorRef,
    scrollBottomAnchorRef,
    scrollToBottom,
    scrollToTop,
    showScrollButton,
  };
};

export default useScreen;
