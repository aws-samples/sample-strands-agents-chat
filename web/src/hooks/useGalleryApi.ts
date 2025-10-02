import useApi from './useApi';
import useSWRInfinite from 'swr/infinite';
import { type Pagination } from '@types';

export const GALLERY_PAGE_SIZE = 20;

export type GalleryItem = {
  bucket: string;
  key: string;
  bucketRegion: string;
  filename: string;
  uploadedAt: string;
  userId: string;
};

const useGalleryApi = () => {
  const { swrFetcher } = useApi();

  const getGalleryItems = () => {
    const getKey = (
      pageIndex: number,
      previousPageData: Pagination<GalleryItem>
    ) => {
      if (previousPageData && !previousPageData.lastEvaluatedKey) return null;
      if (pageIndex === 0) return `gallery?limit=${GALLERY_PAGE_SIZE}`;
      return `gallery?limit=${GALLERY_PAGE_SIZE}&exclusive_start_key=${encodeURIComponent(previousPageData.lastEvaluatedKey!)}`;
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSWRInfinite<Pagination<GalleryItem>>(
      getKey,
      swrFetcher<Pagination<GalleryItem>>,
      {
        revalidateIfStale: false,
      }
    );
  };

  return {
    getGalleryItems,
  };
};

export default useGalleryApi;
