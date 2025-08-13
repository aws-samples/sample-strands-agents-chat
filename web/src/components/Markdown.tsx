import { memo, Suspense, useState } from 'react';
import { default as ReactMarkdown } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import useFile from '../hooks/useFile';
import useCopy from '../hooks/useCopy';
import useSWR from 'swr';
import { reinvalidateOnlyOnMount } from '../swr';

// Reduce bundle size by registering only the languages used in the project
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import ini from 'react-syntax-highlighter/dist/esm/languages/prism/ini';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import perl from 'react-syntax-highlighter/dist/esm/languages/prism/perl';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import xmlDoc from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('diff', diff);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('graphql', graphql);
SyntaxHighlighter.registerLanguage('ini', ini);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('perl', perl);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('xml-doc', xmlDoc);
SyntaxHighlighter.registerLanguage('yaml', yaml);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkRenderer = (props: any) => {
  return (
    <a
      className="text-sky-700 transition-colors duration-300 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300"
      href={props.href}
      target="_blank">
      {props.children}
    </a>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ParagraphRenderer = (props: any) => {
  return <div className="my-0.5">{props.children}</div>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ImageRenderer = memo((props: any) => {
  const { isS3, parseS3Url, downloadUrl } = useFile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Img = () => {
    const fetchDownloadUrl = async () => {
      if (isS3(props.src)) {
        const { key } = parseS3Url(props.src);
        const url = await downloadUrl(key);
        return url;
      } else {
        return props.src;
      }
    };

    const { data: src } = useSWR(
      props.src,
      fetchDownloadUrl,
      reinvalidateOnlyOnMount
    );

    const handleImageClick = () => {
      setIsModalOpen(true);
    };

    const handleModalClose = () => {
      setIsModalOpen(false);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleModalClose();
      }
    };

    const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(src, '_blank', 'noopener,noreferrer');
    };

    return (
      <>
        <div className="my-8 flex justify-start">
          <div className="group relative inline-block">
            <img
              src={src}
              className="cursor-pointer rounded object-contain"
              onClick={handleImageClick}
              alt={props.alt || ''}
            />
            <div className="absolute right-0 bottom-0 left-0 flex items-end justify-end rounded-b bg-gradient-to-t from-black/60 to-transparent p-3 opacity-100 lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:opacity-100">
              <button
                onClick={handleDownload}
                className="cursor-pointer text-white transition-colors duration-200 hover:text-gray-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={handleBackdropClick}>
            <img
              src={src}
              className="max-h-full max-w-full rounded object-contain"
              alt={props.alt || ''}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <Suspense fallback={<span>Image loading...</span>}>
      <Img />
    </Suspense>
  );
});

const CodeRenderer = memo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: any) => {
    const { copy } = useCopy();
    const language = (props.className || '').match(/language-(\w+)/)?.[1];
    const codeText = String(props.children).replace(/\n$/, '');
    const isCodeBlock = codeText.includes('\n');

    return (
      <>
        {language ? (
          <>
            <div className="flex items-center justify-between p-1 pl-3">
              <span className="flex-auto text-xs text-white">{language}</span>
              <button
                className="flex cursor-pointer items-center rounded p-1 text-xs text-gray-300 transition-all duration-200 hover:bg-gray-700 hover:text-white"
                onClick={() => {
                  copy(codeText);
                }}>
                <svg
                  className="h-4 w-4"
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
            <SyntaxHighlighter
              className="rounded"
              style={vscDarkPlus}
              customStyle={{ width: 'full', margin: '0', overflow: 'scroll' }}
              language={language || 'plaintext'}>
              {codeText}
            </SyntaxHighlighter>
          </>
        ) : isCodeBlock ? (
          <code className="block rounded-md text-white">
            {codeText.split('\n').map((line, index) => (
              <span key={`line-${index}`} className="block">
                {line}
              </span>
            ))}
          </code>
        ) : (
          <span className="max-w-full scroll-p-0 overflow-x-auto rounded bg-gray-800 px-1.5 py-0.5 text-sm whitespace-pre text-white dark:bg-gray-900">
            {codeText}
          </span>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      String(prevProps.children) === String(nextProps.children) &&
      prevProps.className === nextProps.className
    );
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Markdown = memo(({ prefix, children }: any) => {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-full transition-colors duration-300">
      <ReactMarkdown
        children={children}
        remarkPlugins={[remarkBreaks]}
        remarkRehypeOptions={{ clobberPrefix: prefix }}
        components={{
          a: LinkRenderer,
          p: ParagraphRenderer,
          img: ImageRenderer,
          pre: ({ children }) => (
            <pre className="my-4 max-w-full rounded bg-slate-800 transition-colors duration-300">
              {children}
            </pre>
          ),
          code: CodeRenderer,
        }}
      />
    </div>
  );
});

export default Markdown;
