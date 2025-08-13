import copy from 'copy-to-clipboard';
import toast from 'react-hot-toast';

const useCopy = () => {
  const copyImpl = (message: string) => {
    copy(message, {
      format: 'text/plain',
    });

    toast.success('Text copied!');
  };

  return {
    copy: copyImpl,
  };
};

export default useCopy;
