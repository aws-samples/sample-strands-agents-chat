import useApi from './useApi';
import useConfig from './useConfig';
import { type FileType } from '@types';
import toast from 'react-hot-toast';

const supportedImageExtensions = ['.png', '.jpg', '.gif', '.webp'];
const supportedVideoExtensions = ['.mp4'];
const supportedDocumentExtensions = ['.pdf', '.csv', '.docx', '.xlsx', '.pptx'];
const supportedExtensions = [
  ...supportedImageExtensions,
  ...supportedVideoExtensions,
  ...supportedDocumentExtensions,
];

const useFile = () => {
  const { config } = useConfig();
  const apiEndpoint = config?.apiEndpoint;
  const { httpRequest } = useApi();

  const filetype = (filename: string): FileType => {
    for (const ext of supportedImageExtensions) {
      if (filename.endsWith(ext)) return 'image';
    }
    for (const ext of supportedVideoExtensions) {
      if (filename.endsWith(ext)) return 'video';
    }
    for (const ext of supportedDocumentExtensions) {
      if (filename.endsWith(ext)) return 'document';
    }

    throw new Error(`Invalid file ${filename}`);
  };

  const upload = async (key: string, blob: Blob): Promise<string> => {
    const req = JSON.stringify({ key });
    const res = await httpRequest(`${apiEndpoint}file/upload`, 'POST', req);
    if (!res.ok) {
      throw new Error('Failed to get upload URL');
    }
    const uploadUrl = await res.json();

    // Upload the file using S3 pre-signed url
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file');
    }

    toast.success('File uploaded!');
    return key;
  };

  const downloadUrl = async (key: string): Promise<string> => {
    const req = JSON.stringify({ key });
    const res = await httpRequest(`${apiEndpoint}file/download`, 'POST', req);
    const downloadUrl = await res.json();
    return downloadUrl;
  };

  const parseS3Url = (
    url: string
  ): { bucket: string; key: string; region?: string } => {
    // Validate input to prevent code injection
    if (typeof url !== 'string' || url.length > 2048) {
      throw new Error('Invalid URL format');
    }

    // Sanitize URL by removing potentially dangerous characters
    const sanitizedUrl = url.replace(/[<>"']/g, '');

    let result = sanitizedUrl.match(/^s3:\/\/([a-zA-Z0-9.-]+)\/(.+)/);

    if (!result) {
      result = sanitizedUrl.match(
        /^https:\/\/s3\.([a-zA-Z0-9-]+)\.amazonaws\.com\/([a-zA-Z0-9.-]+)\/(.+)$/
      );
      if (result) {
        return { bucket: result[2], key: result[3], region: result[1] };
      }
    }

    if (!result) {
      result = sanitizedUrl.match(
        /^https:\/\/([a-zA-Z0-9.-]+)\.s3[.-]?([a-zA-Z0-9-]*)\.amazonaws\.com\/(.+)$/
      );
      if (result) {
        return {
          bucket: result[1],
          key: result[3],
          region: result[2] || undefined,
        };
      }
    }

    if (!result) {
      throw new Error('Invalid S3 URL format');
    }

    return { bucket: result[1], key: result[2] };
  };

  const isS3 = (url: string): boolean => {
    return parseS3Url(url) !== null;
  };

  return {
    filetype,
    supportedExtensions,
    upload,
    downloadUrl,
    isS3,
    parseS3Url,
  };
};

export default useFile;
