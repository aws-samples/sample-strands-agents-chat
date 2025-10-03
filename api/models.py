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
    tools: list[str] | None = None


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
    userMessage: MessageWillBeInTable
    assistantMessage: MessageWillBeInTable


class ToolSelectionRequest(BaseModel):
    prompt: str


class ToolSelectionResponse(BaseModel):
    reasoning: bool
    imageGeneration: bool
    webSearch: bool
    awsDocumentation: bool
    codeInterpreter: bool
    webBrowser: bool
    weather: bool


class GalleryItem(BaseModel):
    bucket: str
    key: str
    bucketRegion: str
    filename: str
    uploadedAt: str
    userId: str
