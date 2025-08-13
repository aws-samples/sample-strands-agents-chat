import useChatApi, { CHATS_PAGE_SIZE } from './useChatApi';
import usePagination from './usePagination';

const useChats = () => {
  const { getChats } = useChatApi();
  const {
    flattenData: chats,
    mutate: reloadChats,
    canLoadMore,
    loadMore,
    isLoading,
  } = usePagination(getChats(), CHATS_PAGE_SIZE);

  return {
    chats,
    reloadChats,
    canLoadMore,
    loadMore,
    isLoading,
  };
};

export default useChats;
