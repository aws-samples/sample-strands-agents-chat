import { memo, useState } from 'react';
import useFile from '../hooks/useFile';
import useSWR from 'swr';

interface GalleryImageProps {
  src: string;
  alt?: string;
  className?: string;
}

const GalleryImage = memo(({ src, alt, className = '' }: GalleryImageProps) => {
  const { isS3, parseS3Url, downloadUrl } = useFile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fetchDownloadUrl = async () => {
    if (isS3(src)) {
      const { key } = parseS3Url(src);
      const url = await downloadUrl(key);
      return url;
    } else {
      return src;
    }
  };

  const { data: downloadSrc, isLoading } = useSWR(src, fetchDownloadUrl, {
    suspense: false,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: true,
    dedupingInterval: 300000, // 5 minutes
  });

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
    window.open(downloadSrc, '_blank', 'noopener,noreferrer');
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Loading state
  if (isLoading || !downloadSrc) {
    return (
      <div
        className={`flex animate-pulse items-center justify-center rounded bg-gray-200 dark:bg-gray-700 ${className}`}>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="group relative">
        <img
          src={downloadSrc}
          className={`cursor-pointer rounded object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onClick={handleImageClick}
          onLoad={handleImageLoad}
          alt={alt || ''}
        />
        {imageLoaded && (
          <div className="absolute right-0 bottom-0 left-0 flex items-end justify-end rounded-b bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:opacity-100">
            <button
              onClick={handleDownload}
              className="cursor-pointer text-white transition-colors duration-200 hover:text-gray-300">
              <svg
                className="h-5 w-5"
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
        )}
      </div>

      {/* Expanded modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={handleBackdropClick}>
          <img
            src={downloadSrc}
            className="max-h-full max-w-full rounded object-contain"
            alt={alt || ''}
          />
        </div>
      )}
    </>
  );
});

export default GalleryImage;
