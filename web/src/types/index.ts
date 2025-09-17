export type InTable = {
  queryId: string;
  orderBy: string;
  resourceId: string;
  dataType: string;
  userId: string;
};

export type Chat = {
  title: string;
};

export type ChatInTable = Chat & InTable;

export type TextContent = {
  text: string;
};

export type FileType = 'image' | 'video' | 'document';

export type FileContent = {
  type: FileType;
  extension: string;
  name: string;
  s3Key: string;
  displayName: string;
};

export type ContentBlock = TextContent | FileContent;

export type Role = 'user' | 'assistant' | 'system';

export type MessageNotInTable = {
  role: Role;
  content: ContentBlock[];
  tools?: string[] | null;
};

export type MessageShown = MessageNotInTable & Partial<InTable>;

export type MessageInTable = MessageNotInTable & InTable;

export type MessageWillBeInTable = MessageNotInTable & {
  resourceId: string;
};

export type Pagination<T> = {
  items: T[];
  lastEvaluatedKey?: string;
};

export type StreamChunk = {
  text: string;
};
