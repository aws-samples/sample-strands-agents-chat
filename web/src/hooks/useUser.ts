import { useMemo } from 'react';
import useSWR from 'swr';
import { fetchAuthSession } from 'aws-amplify/auth';

const useUser = () => {
  const { data } = useSWR('user', () => {
    return fetchAuthSession();
  });

  const sub = useMemo<string>(() => {
    return (data?.tokens?.idToken?.payload.sub ?? '') as string;
  }, [data]);

  const email = useMemo<string>(() => {
    return (data?.tokens?.idToken?.payload.email ?? '') as string;
  }, [data]);

  return {
    sub,
    email,
  };
};

export default useUser;
