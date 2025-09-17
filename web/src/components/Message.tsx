import { useMemo } from 'react';
import useFile from '../hooks/useFile';
import useCopy from '../hooks/useCopy';
import { type MessageShown, type TextContent, type FileContent } from '@types';
import Markdown from './Markdown';
import Loading from './Loading';
import ToolIconsList from './ToolIconsList';

function Message(props: { message: MessageShown; loading: boolean }) {
  const { downloadUrl } = useFile();
  const { copy } = useCopy();

  const fileContents: FileContent[] | null = useMemo(() => {
    if (props.message.content.length <= 1) {
      return null;
    }

    return props.message.content.slice(1) as FileContent[];
  }, [props]);

  const download = async (s3Key: string) => {
    const url = await downloadUrl(s3Key);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isUser = props.message.role === 'user';

  return (
    <div className="mx-auto mb-6 w-full max-w-4xl px-4 lg:px-0">
      <div className={`${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`${
            isUser
              ? 'max-w-2xl rounded-2xl rounded-br-none bg-blue-500 px-4 py-3 text-white'
              : 'w-full text-gray-900 dark:text-gray-100'
          } transition-colors duration-300`}>
          <div className={isUser ? 'text-left' : ''}>
            <Markdown>
              {(props.message.content[0] as TextContent).text}
            </Markdown>

            {isUser &&
              props.message.tools &&
              props.message.tools.length > 0 && (
                <ToolIconsList tools={props.message.tools} />
              )}

            {fileContents && (
              <div className="mt-4 flex flex-col justify-start gap-y-1.5 border-t-1 border-blue-300 pt-2">
                {fileContents.map((f, idx) => {
                  return (
                    <a
                      className={`flex cursor-pointer items-center gap-1 rounded text-xs transition-colors duration-300 ${
                        isUser
                          ? 'text-blue-100 hover:text-white focus:outline-none active:text-blue-50'
                          : 'text-blue-600 hover:text-blue-800 focus:outline-none active:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 dark:active:text-blue-200'
                      }`}
                      key={idx}
                      onClick={() => {
                        download(f.s3Key);
                      }}>
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM16 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                      {f.displayName}
                    </a>
                  );
                })}
              </div>
            )}

            {props.loading && (
              <div className="flex h-8 items-center justify-center">
                <Loading size="md" />
              </div>
            )}

            {!props.loading && !isUser && (
              <div className="flex h-8 items-center justify-start">
                <button
                  className="flex cursor-pointer items-center rounded p-1 text-xs text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  onClick={() => {
                    copy((props.message.content[0] as TextContent).text);
                  }}>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
