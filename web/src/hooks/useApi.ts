import { fetchAuthSession } from 'aws-amplify/auth';
import useConfig from './useConfig';

const useApi = () => {
  const { config } = useConfig();
  const apiEndpoint = config?.apiEndpoint;

  const swrFetcher = async <T>(path: string): Promise<T> => {
    return (await httpRequest(`${apiEndpoint}${path}`, 'GET')).json() as T;
  };

  const httpRequest = async (
    endpoint: string,
    method: string,
    body?: string,
    headers?: Record<string, string>
  ): Promise<Response> => {
    const token = (await fetchAuthSession()).tokens?.idToken?.toString();
    const headersWithToken = {
      ...(headers ?? {}),
      ...(body && body?.length > 0
        ? { 'Content-Type': 'application/json' }
        : undefined),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(endpoint, {
      method,
      headers: headersWithToken,
      body,
    });

    return response;
  };

  return {
    swrFetcher,
    httpRequest,
  };
};

export default useApi;
