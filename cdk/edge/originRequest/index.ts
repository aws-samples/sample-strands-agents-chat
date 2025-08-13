import { CloudFrontRequestHandler } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { createHash } from 'crypto';

export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;

  // Preflight request
  if (request.method === 'OPTIONS') {
    return request;
  }

  const headers = request.headers;

  let payload: Buffer = Buffer.alloc(0);

  if (request.body?.data) {
    const { data, encoding = 'base64' } = request.body;
    if (encoding === 'base64') {
      payload = Buffer.from(data, 'base64');
    } else if (encoding === 'text') {
      payload = Buffer.from(data, 'utf8');
    } else {
      return {
        status: '401',
        statusDescription: 'Unauthorized',
        body: 'Unauthorized',
      };
    }
  }

  const hashHex = createHash('sha256').update(payload).digest('hex');

  headers['x-amz-content-sha256'] = [
    { key: 'x-amz-content-sha256', value: hashHex },
  ];

  const auth = headers?.['authorization']?.[0]?.value ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  const customHeaders = request.origin?.custom?.customHeaders;
  const userPoolId = customHeaders?.['x-user-pool-id']?.[0]?.value ?? '';
  const clientId = customHeaders?.['x-user-pool-client-id']?.[0]?.value ?? '';

  const verifier = CognitoJwtVerifier.create({
    userPoolId,
    clientId,
    tokenUse: 'id',
  });

  try {
    const payload = await verifier.verify(token);

    headers['x-user-sub'] = [{ key: 'x-user-sub', value: payload.sub }];

    delete headers['authorization'];

    return request;
  } catch (e) {
    console.error(
      'JWT verification failed:',
      e instanceof Error ? e.message : 'Unknown error'
    );

    return {
      status: '401',
      statusDescription: 'Unauthorized',
      body: 'Unauthorized',
    };
  }
};
