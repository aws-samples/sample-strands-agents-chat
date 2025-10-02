import useGalleryApi, { GALLERY_PAGE_SIZE } from './useGalleryApi';
import usePagination from './usePagination';

const useGallery = () => {
  const { getGalleryItems } = useGalleryApi();
  const {
    flattenData: galleryItems,
    mutate: reloadGallery,
    canLoadMore,
    loadMore,
    isLoading,
  } = usePagination(getGalleryItems(), GALLERY_PAGE_SIZE);

  return {
    galleryItems,
    reloadGallery,
    canLoadMore,
    loadMore,
    isLoading,
  };
};

export default useGallery;
