import useApi from './useApi';
import useConfig from './useConfig';
import useSWRInfinite from 'swr/infinite';
import {
  type ChatInTable,
  type MessageInTable,
  type MessageNotInTable,
  type MessageWillBeInTable,
  type Pagination,
} from '@types';

export const CHATS_PAGE_SIZE = 20;

const useChatApi = () => {
  const { httpRequest, swrFetcher } = useApi();
  const { config } = useConfig();
  const apiEndpoint = config?.apiEndpoint;

  const createChat = async (resourceId: string): Promise<ChatInTable> => {
    const res = await httpRequest(
      `${apiEndpoint}chat`,
      'POST',
      JSON.stringify({ resourceId })
    );
    if (!res.ok) {
      throw new Error(`Failed to create chat: ${res.status}`);
    }
    return await res.json();
  };

  const getChats = () => {
    const getKey = (
      pageIndex: number,
      previousPageData: Pagination<ChatInTable>
    ) => {
      if (previousPageData && !previousPageData.lastEvaluatedKey) return null;
      if (pageIndex === 0) return `chat?limit=${CHATS_PAGE_SIZE}`;
      return `chat?limit=${CHATS_PAGE_SIZE}&exclusive_start_key=${encodeURIComponent(previousPageData.lastEvaluatedKey!)}`;
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSWRInfinite<Pagination<ChatInTable>>(
      getKey,
      swrFetcher<Pagination<ChatInTable>>,
      {
        revalidateIfStale: false,
      }
    );
  };

  const getChat = async (resourceId: string) => {
    const res = await httpRequest(`${apiEndpoint}chat/${resourceId}`, 'GET');
    if (res.status !== 200) {
      return await res.json();
    } else {
      return null;
    }
  };

  const createMessages = async (
    resourceId: string,
    messages: MessageWillBeInTable[]
  ): Promise<MessageInTable[]> => {
    const res = await httpRequest(
      `${apiEndpoint}chat/${resourceId}/messages`,
      'POST',
      JSON.stringify({ messages })
    );
    if (!res.ok) {
      throw new Error(`Failed to create messages: ${res.status}`);
    }
    return await res.json();
  };

  const updateMessages = async (
    resourceId: string,
    messages: MessageInTable[]
  ): Promise<MessageInTable[]> => {
    const res = await httpRequest(
      `${apiEndpoint}chat/${resourceId}/messages`,
      'PUT',
      JSON.stringify({ messages })
    );
    if (!res.ok) {
      throw new Error(`Failed to update messages: ${res.status}`);
    }
    return await res.json();
  };

  const getMessages = async (resourceId: string): Promise<MessageInTable[]> => {
    const res = await httpRequest(
      `${apiEndpoint}chat/${resourceId}/messages`,
      'GET'
    );
    if (!res.ok) {
      throw new Error(`Failed to get messages: ${res.status}`);
    }
    return await res.json();
  };

  const createTitle = async (
    chatId: string,
    messages: MessageNotInTable[]
  ): Promise<void> => {
    const res = await httpRequest(
      `${apiEndpoint}chat/${chatId}/title`,
      'POST',
      JSON.stringify({ messages })
    );
    if (!res.ok) {
      throw new Error(`Failed to create title: ${res.status}`);
    }
  };

  return {
    createChat,
    getChats,
    getChat,
    createMessages,
    updateMessages,
    getMessages,
    createTitle,
  };
};

export default useChatApi;
