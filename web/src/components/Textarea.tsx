import React, { useLayoutEffect, useRef } from 'react';
import { isMobileDevice } from '../utils/deviceDetection';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
};

const MAX_HEIGHT = 300;

const Textarea: React.FC<Props> = (props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    // Reset the height to auto to calculate the scroll height
    ref.current.style.height = 'auto';
    ref.current.style.overflowY = 'hidden';

    // Ensure the layout is updated before calculating the scroll height
    // due to the bug in Firefox:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1795904
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1787062
    void ref.current.scrollHeight;

    // Set the height to match content, up to max height
    const scrollHeight = ref.current.scrollHeight;
    const isMax = scrollHeight > MAX_HEIGHT;
    ref.current.style.height = (isMax ? MAX_HEIGHT : scrollHeight) + 'px';
    ref.current.style.overflowY = isMax ? 'auto' : 'hidden';
  }, [props.value]);

  return (
    <textarea
      ref={ref}
      className="w-full resize-none rounded-md p-1.5 text-gray-900 placeholder-gray-500 transition-colors duration-300 focus:outline-none dark:text-gray-100 dark:placeholder-gray-400"
      rows={1}
      value={props.value}
      onChange={(e) => {
        props.onChange(e.target.value);
      }}
      onKeyDown={(e) => {
        // keyCode is deprecated, but used for some browsers to handle IME input
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;

        // On mobile devices, don't submit on Enter key to allow multiline input
        // Users should use the send button instead
        if (isMobileDevice() && e.key === 'Enter') {
          return; // Allow default behavior (new line)
        }

        // On desktop, Enter without Shift submits the message
        if (props.onEnter && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          props.onEnter();
        }
      }}
    />
  );
};

export default Textarea;
