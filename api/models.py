from pydantic import BaseModel


class InTable(BaseModel):
    queryId: str
    orderBy: str
    resourceId: str
    dataType: str
    userId: str


class MessageNotInTable(BaseModel):
    role: str
    content: list[dict[str, str]]


class MessageInTable(MessageNotInTable, InTable):
    pass


class MessageWillBeInTable(MessageNotInTable):
    resourceId: str


class S3File(BaseModel):
    key: str


class CreateChat(BaseModel):
    resourceId: str


class CreateMessages(BaseModel):
    messages: list[MessageWillBeInTable]


class UpdateMessages(BaseModel):
    messages: list[MessageWillBeInTable]


class CreateTitle(BaseModel):
    messages: list[MessageNotInTable]


class StreamingRequest(BaseModel):
    resourceId: str
    modelId: str
    modelRegion: str
    userMessage: MessageNotInTable
    reasoning: bool
    imageGeneration: bool
    webSearch: bool
    awsDocumentation: bool
