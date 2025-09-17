import type { MessageWillBeInTable, StreamChunk } from '@types';
import useApi from './useApi';
import useConfig from './useConfig';
import useChats from './useChats';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface ReadableStream<R = any> {
    [Symbol.asyncIterator](): AsyncIterableIterator<R>;
    values(options?: { preventCancel?: boolean }): AsyncIterableIterator<R>;
  }
}

const useChatStream = () => {
  const { httpRequest } = useApi();
  const { config } = useConfig();
  const apiEndpoint = config?.apiEndpoint;
  const { reloadChats } = useChats();

  const postNewMessage = async function* (
    resourceId: string,
    modelId: string,
    modelRegion: string,
    userMessage: MessageWillBeInTable,
    assistantMessage: MessageWillBeInTable
  ) {
    const req = JSON.stringify({
      resourceId,
      modelId,
      modelRegion,
      userMessage,
      assistantMessage,
    });

    const res = await httpRequest(`${apiEndpoint}streaming`, 'POST', req);
    const stream = res!.body!.pipeThrough(new TextDecoderStream());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let error: any = null;
    let chatsReloaded = false;

    for await (const chunk of stream) {
      if (!chatsReloaded) {
        reloadChats();
        chatsReloaded = true;
      }

      const chunkJsonL = chunk.split('\n');

      for (const chunkJson of chunkJsonL) {
        if (chunkJson.length > 0) {
          try {
            const chunkParsed: StreamChunk = JSON.parse(chunkJson);
            yield chunkParsed;
          } catch (e) {
            console.error(e);
            error = e;
            break;
          }
        }
      }

      if (error !== null) {
        yield { text: 'ERROR' };
        break;
      }
    }
  };

  return {
    postNewMessage,
  };
};

export default useChatStream;
