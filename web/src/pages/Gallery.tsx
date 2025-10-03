import { useEffect, useRef, useCallback } from 'react';
import useGallery from '../hooks/useGallery';
import useScreen from '../hooks/useScreen';
import GalleryImage from '../components/GalleryImage';
import Loading from '../components/Loading';

function Gallery() {
  const { galleryItems, canLoadMore, loadMore, isLoading } = useGallery();
  const { screen, isAtBottom, notifyScreen } = useScreen();
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-load more items when scrolling to bottom
  const handleScroll = useCallback(() => {
    if (isAtBottom && canLoadMore && !isLoading) {
      loadMore();
    }
  }, [isAtBottom, canLoadMore, isLoading, loadMore]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  // Auto-load if content doesn't fill the container
  useEffect(() => {
    const checkAndLoadMore = () => {
      if (!contentRef.current || !screen.current) return;

      const containerHeight = screen.current.clientHeight;
      const contentHeight = contentRef.current.scrollHeight;

      // If content doesn't fill the container and we can load more
      if (contentHeight <= containerHeight && canLoadMore && !isLoading) {
        loadMore();
      }
    };

    // Check after initial render and when items change
    const timer = setTimeout(checkAndLoadMore, 100);
    return () => clearTimeout(timer);
  }, [galleryItems, canLoadMore, isLoading, loadMore, screen]);

  useEffect(() => {
    notifyScreen();
  }, [notifyScreen]);

  return (
    <div className="relative mt-14 flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gallery
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Your uploaded images and files
        </p>
      </div>

      {/* Gallery content */}
      <div ref={screen} className="custom-scrollbar flex-1 overflow-y-auto p-4">
        <div ref={contentRef}>
          {galleryItems.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                No images yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start a chat and upload some images to see them here.
              </p>
            </div>
          ) : (
            <>
              {/* Responsive grid layout */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {galleryItems.map((item, index) => {
                  // Create S3 URL from item data
                  const s3Url = `s3://${item.bucket}/${item.key}`;

                  return (
                    <div key={index} className="aspect-square">
                      <GalleryImage
                        src={s3Url}
                        alt={item.filename}
                        className="h-full w-full"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Loading className="text-gray-600 dark:text-gray-400" />
                </div>
              )}

              {/* End of gallery message */}
              {!canLoadMore && galleryItems.length > 0 && (
                <div className="flex justify-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You've reached the end of your gallery
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Gallery;
