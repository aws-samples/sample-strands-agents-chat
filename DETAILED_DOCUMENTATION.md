# Strands Agents Chat - Comprehensive Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend API Documentation](#backend-api-documentation)
6. [Frontend Application](#frontend-application)
7. [Infrastructure & Deployment](#infrastructure--deployment)
8. [Configuration & Environment](#configuration--environment)
9. [AI Integration & Tools](#ai-integration--tools)
10. [Security & Authentication](#security--authentication)
11. [Development Workflow](#development-workflow)
12. [Deployment Guide](#deployment-guide)
13. [Customization Options](#customization-options)
14. [Troubleshooting](#troubleshooting)

## Project Overview

Strands Agents Chat is a full-stack AI chat application that leverages Amazon Bedrock, Strands Agents, and Bedrock AgentCore to provide an advanced conversational AI experience. The application supports multi-modal interactions, tool integration, and real-time streaming responses.

### Key Features
- **Multi-modal Chat**: Support for text, images, videos, and documents
- **Advanced AI Reasoning**: Deep reasoning capabilities for complex problem solving
- **Image Generation**: AI-powered image creation using Nova Canvas
- **Web Search**: Real-time web search via Tavily API
- **AWS Documentation Search**: Integrated AWS documentation access
- **Code Interpreter**: Execute and analyze code in real-time
- **Web Browser**: Browse and analyze web content
- **Responsive Design**: Optimized for desktop and mobile
- **Real-time Streaming**: Server-sent events for live response streaming
- **User Authentication**: Secure authentication via AWS Cognito
- **File Management**: S3-based file upload and sharing

## Architecture

The application follows a serverless, three-tier architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │  Infrastructure │
│   (React SPA)   │◄──►│  (FastAPI/Lambda)│◄──►│   (AWS Services)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Interaction Flow
1. **User Interface**: React SPA hosted on S3 + CloudFront
2. **API Gateway**: CloudFront routes `/api/*` to Lambda Function URL
3. **Application Logic**: FastAPI running on AWS Lambda
4. **AI Processing**: Amazon Bedrock models with Strands Agents
5. **Data Storage**: DynamoDB for chat history, S3 for file storage
6. **Authentication**: AWS Cognito User Pools + Identity Pools

## Technology Stack

### Frontend
- **React 19**: Modern React with concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Vite**: Fast build tool and development server
- **AWS Amplify UI**: Pre-built authentication components
- **SWR**: Data fetching and caching
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **React Markdown**: Markdown rendering with syntax highlighting

### Backend
- **Python 3.13**: Latest Python runtime
- **FastAPI**: Modern, fast web framework
- **Strands Agents 1.4.0**: AI agent orchestration
- **Pydantic**: Data validation and serialization
- **Boto3**: AWS SDK for Python
- **MCP (Model Context Protocol)**: Tool integration protocol
- **Uvicorn**: ASGI server

### Infrastructure
- **AWS CDK**: Infrastructure as Code
- **AWS Lambda**: Serverless compute
- **Amazon DynamoDB**: NoSQL database
- **Amazon S3**: Object storage
- **Amazon CloudFront**: CDN and edge computing
- **AWS Cognito**: Authentication and authorization
- **AWS WAF**: Web application firewall
- **Amazon Bedrock**: AI/ML services

### AI & ML Services
- **Amazon Bedrock**: Foundation models (Claude, Nova)
- **Bedrock AgentCore**: Code interpreter and web browser
- **Nova Canvas**: Image generation
- **Tavily API**: Web search capabilities
- **MCP Servers**: Extensible tool ecosystem

## Project Structure

```
strands-agents-chat/
├── api/                    # Python FastAPI Backend
│   ├── routers/           # API route handlers
│   │   ├── chat.py        # Chat management endpoints
│   │   ├── file.py        # File upload/download
│   │   └── streaming.py   # Real-time streaming
│   ├── services/          # Business logic layer
│   │   ├── chat_service.py        # Chat operations
│   │   ├── streaming_service.py   # Stream processing
│   │   └── tool_selection_service.py # AI tool selection
│   ├── main.py           # FastAPI application entry
│   ├── config.py         # Environment configuration
│   ├── models.py         # Pydantic data models
│   ├── database.py       # DynamoDB operations
│   ├── s3.py            # S3 file operations
│   ├── tools.py         # Custom AI tools
│   ├── utils.py         # Utility functions
│   └── Dockerfile       # Container configuration
├── web/                  # React Frontend Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── swr/          # SWR configuration
│   ├── public/           # Static assets
│   └── package.json      # Dependencies and scripts
├── cdk/                  # AWS CDK Infrastructure
│   ├── lib/              # CDK stack definitions
│   │   ├── strands-chat-stack.ts  # Main application stack
│   │   └── waf-stack.ts           # WAF security rules
│   ├── bin/              # CDK app entry point
│   ├── edge/             # CloudFront edge functions
│   └── parameter.ts      # Deployment configuration
└── img/                  # Documentation images
```

## Backend API Documentation

### Core API Structure

The backend is built with FastAPI and organized into three main routers:

#### 1. Chat Router (`/api/chat`)

**Endpoints:**
- `POST /api/chat` - Create new chat session
- `GET /api/chat` - List user's chat sessions (paginated)
- `GET /api/chat/{resource_id}` - Get specific chat details
- `POST /api/chat/{resource_id}/messages` - Add messages to chat
- `PUT /api/chat/{resource_id}/messages` - Update existing messages
- `GET /api/chat/{resource_id}/messages` - Retrieve chat messages
- `POST /api/chat/{resource_id}/title` - Generate chat title
- `POST /api/chat/select-tools` - AI-powered tool selection

#### 2. File Router (`/api/file`)

**Endpoints:**
- `POST /api/file/upload` - Generate S3 upload URL
- `POST /api/file/download` - Generate S3 download URL

#### 3. Streaming Router (`/api/streaming`)

**Endpoints:**
- `POST /api/streaming` - Real-time chat streaming with Server-Sent Events

### Data Models

#### Message Structure
```python
class MessageNotInTable(BaseModel):
    role: str                    # "user" or "assistant"
    content: list[dict[str, str]] # Message content blocks
    tools: list[str] | None      # Enabled AI tools

class MessageInTable(MessageNotInTable, InTable):
    queryId: str        # Partition key: "{resourceId}$message"
    orderBy: str        # Sort key: timestamp
    resourceId: str     # Chat session identifier
    dataType: str       # "message"
    userId: str         # User identifier
```

#### Tool Selection Response
```python
class ToolSelectionResponse(BaseModel):
    reasoning: bool          # Enable step-by-step reasoning
    imageGeneration: bool    # Enable image creation
    webSearch: bool         # Enable web search
    awsDocumentation: bool  # Enable AWS docs search
    codeInterpreter: bool   # Enable code execution
    webBrowser: bool        # Enable web browsing
```

### Database Schema (DynamoDB)

#### Primary Table Structure
- **Partition Key**: `queryId` (string)
- **Sort Key**: `orderBy` (string)

#### Global Secondary Indexes
1. **ResourceIndex**: Partition key `resourceId`
2. **DataTypeIndex**: Partition key `dataType`, Sort key `orderBy`

#### Data Types
- **Chat Records**: `{userId}$chat` / `{timestamp}`
- **Message Records**: `{resourceId}$message` / `{timestamp}`

### Authentication & Authorization

All API endpoints require AWS IAM authentication via:
- **Header**: `x-user-sub` (Cognito user identifier)
- **Authorization**: AWS Signature Version 4

Access control is enforced at the application level:
- Users can only access their own chats and messages
- Resource ownership validation on all operations

## Frontend Application

### Component Architecture

#### Core Components

**App.tsx** - Main application shell
- Theme management
- Drawer state management
- Toast notifications
- Responsive layout

**Header.tsx** - Navigation header
- User authentication status
- Theme toggle
- Drawer toggle
- Model selection

**Drawer.tsx** - Sidebar navigation
- Chat history
- New chat creation
- Chat management

**Chat.tsx** - Main chat interface
- Message display
- Input handling
- Tool selection
- Streaming responses

#### State Management

**React Context Providers:**
- `ThemeContext` - Dark/light theme state
- `ConfigContext` - Application configuration
- `ParameterContext` - Runtime parameters

**Custom Hooks:**
- `useChatState` - Chat session management
- `useChatStream` - Real-time streaming
- `useToolSelection` - AI tool selection
- `useAutoMode` - Automatic tool selection
- `useChatApi` - API interactions

### Key Features Implementation

#### Real-time Streaming
```typescript
// Streaming implementation using Server-Sent Events
const useChatStream = () => {
  const streamChat = async (request: StreamingRequest) => {
    const response = await fetch('/api/streaming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    const reader = response.body?.getReader();
    // Process streaming chunks...
  };
};
```

#### Tool Selection
```typescript
// Automatic tool selection based on user input
const useToolSelection = () => {
  const selectTools = async (prompt: string) => {
    const response = await fetch('/api/chat/select-tools', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
    return response.json();
  };
};
```

#### File Upload
```typescript
// S3 presigned URL upload
const useFile = () => {
  const uploadFile = async (file: File) => {
    // Get presigned URL
    const { url } = await fetch('/api/file/upload', {
      method: 'POST',
      body: JSON.stringify({ key: file.name })
    }).then(r => r.json());
    
    // Upload to S3
    await fetch(url, {
      method: 'PUT',
      body: file
    });
  };
};
```

## Infrastructure & Deployment

### AWS CDK Stack Components

#### Core Infrastructure (`StrandsChatStack`)

**Compute:**
- Lambda Function (Docker container)
- Provisioned concurrency for performance
- Function URL with IAM authentication
- CloudFront distribution

**Storage:**
- DynamoDB table with GSIs
- S3 buckets (web assets, files, logs)
- Automatic cleanup policies

**Security:**
- Cognito User Pool + Identity Pool
- WAF with customizable rules
- IAM roles and policies
- S3 bucket encryption

**Networking:**
- CloudFront distribution
- Origin Access Control (OAC)
- Edge functions for routing
- CORS configuration

#### Security Stack (`WafStack`)

**WAF Rules:**
- Rate limiting
- Geographic restrictions (configurable)
- IP allowlists (configurable)
- Common attack protection

### Deployment Architecture

```
Internet
    ↓
CloudFront (CDN + WAF)
    ├── Static Assets → S3 (Web Bucket)
    └── /api/* → Lambda Function URL
                     ↓
                 FastAPI Application
                     ├── DynamoDB (Chat Data)
                     ├── S3 (File Storage)
                     └── Bedrock (AI Services)
```

## Configuration & Environment

### Parameter Configuration (`parameter.ts`)

```typescript
export const parameter: Parameter = {
  appRegion: 'ap-northeast-1',           // Deployment region
  
  models: [                              // Available AI models
    {
      id: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      region: 'us-east-1',
      displayName: 'Claude Sonnet 4'
    }
  ],
  
  tavilyApiKeySecretArn: null,          // Web search API key
  novaCanvasRegion: 'ap-northeast-1',   // Image generation region
  agentCoreRegion: 'us-east-1',         // Code interpreter region
  
  createTitleModel: {                    // Title generation model
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    region: 'ap-northeast-1'
  },
  
  provisionedConcurrency: 5              // Lambda warm instances
};
```

### Environment Variables

**Lambda Environment:**
- `BUCKET` - S3 bucket for file storage
- `TABLE` - DynamoDB table name
- `RESOURCE_INDEX_NAME` - GSI name
- `PARAMETER` - JSON configuration
- `TAVILY_API_KEY` - Web search API key

**Frontend Environment:**
- `VITE_CONFIG_ENDPOINT` - Configuration endpoint URL

## AI Integration & Tools

### Strands Agents Integration

The application uses Strands Agents framework for AI orchestration:

```python
# Agent initialization with tools and model
agent = Agent(
    system_prompt=session_system_prompt,
    model=BedrockModel(**model_params),
    tools=tools,
    messages=build_messages(prev_messages)
)

# Streaming response processing
async for event in agent.stream_async(user_message):
    # Process different event types
    if "contentBlockDelta" in event["event"]:
        # Handle text, reasoning, or tool use
```

### Available Tools

#### Built-in Tools
- `current_time` - Get current date/time
- `calculator` - Mathematical calculations
- `sleep` - Delay execution
- `upload_file_to_s3_and_retrieve_s3_url` - File upload

#### MCP (Model Context Protocol) Tools
- **Nova Canvas MCP**: Image generation
- **AWS Documentation MCP**: AWS service documentation
- **Web Search**: Tavily API integration

#### AgentCore Tools
- **Code Interpreter**: Execute Python code
- **Web Browser**: Browse and analyze web pages

### Tool Selection Logic

The application includes intelligent tool selection:

```python
def select_tools_for_prompt(prompt: str) -> dict:
    """AI-powered tool selection based on user input"""
    # Analyze prompt with LLM
    # Return boolean flags for each tool type
    return {
        "reasoning": bool,
        "imageGeneration": bool,
        "webSearch": bool,
        "awsDocumentation": bool,
        "codeInterpreter": bool,
        "webBrowser": bool
    }
```

### Session Management

Each chat session gets isolated workspace:

```python
# Create session-specific workspace
session_id = generate_session_id()
session_workspace_dir = create_session_workspace(session_id, WORKSPACE_DIR)

# Session-aware file upload tool
session_upload_tool = create_session_aware_upload_tool(session_workspace_dir)

# Cleanup after completion
cleanup_session_workspace(session_id, WORKSPACE_DIR)
```

## Security & Authentication

### Authentication Flow

1. **User Registration/Login**: AWS Cognito User Pool
2. **Token Exchange**: Cognito Identity Pool for AWS credentials
3. **API Authentication**: AWS Signature V4 with IAM
4. **Authorization**: Application-level user validation

### Security Features

**Data Protection:**
- S3 bucket encryption (SSE-S3)
- DynamoDB encryption at rest
- HTTPS/TLS for all communications
- Presigned URLs for secure file access

**Access Control:**
- User isolation (users can only access their data)
- Resource-level authorization
- WAF protection against common attacks
- CORS configuration

**Infrastructure Security:**
- Private Lambda execution
- VPC endpoints (optional)
- CloudFront security headers
- Origin Access Control (OAC)

### WAF Configuration

```typescript
// Example IP restriction
const ipSet = new wafv2.CfnIPSet(this, 'AllowedIPs', {
  addresses: ['192.168.1.0/24', '10.0.0.0/8'],
  ipAddressVersion: 'IPV4',
  scope: 'CLOUDFRONT'
});

// Example geo restriction
const geoRule = {
  geoMatchStatement: {
    countryCodes: ['US', 'JP', 'CA']
  }
};
```

## Development Workflow

### Local Development Setup

#### Prerequisites
- Node.js 18+ and npm
- Python 3.13+
- AWS CLI configured
- Docker (for Lambda container)

#### Backend Development
```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
uvicorn main:app --reload --port 8080
```

#### Frontend Development
```bash
cd web
npm ci
npm run dev  # Starts at http://localhost:5173
```

#### Infrastructure Development
```bash
cd cdk
npm ci
cp parameter.template.ts parameter.ts
# Edit parameter.ts with your configuration
npx cdk diff  # Preview changes
npx cdk deploy --all
```

### Code Quality Tools

#### Backend (Python)
- **Ruff**: Linting and formatting
- **Type hints**: Full type annotation
- **Pydantic**: Runtime validation

#### Frontend (TypeScript)
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

#### Infrastructure (CDK)
- **ESLint**: CDK-specific rules
- **Prettier**: Consistent formatting
- **TypeScript**: Type-safe infrastructure

### Pre-commit Validation

```bash
./pre_check.sh  # Runs all quality checks
```

This script validates:
- Code formatting (Prettier)
- Linting (ESLint, Ruff)
- Type checking (TypeScript, Python)
- Build processes

## Deployment Guide

### Step-by-Step Deployment

#### 1. Prerequisites Setup
```bash
# Install AWS CDK
npm install -g aws-cdk

# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity
```

#### 2. Optional: Tavily API Setup
```bash
# Create secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "tavily-api-key" \
  --description "Tavily API Key for web search" \
  --secret-string "your-tavily-api-key"

# Note the SecretArn for parameter.ts
```

#### 3. Configuration
```bash
cd cdk
npm ci
cp parameter.template.ts parameter.ts
# Edit parameter.ts with your settings
```

#### 4. Deploy Infrastructure
```bash
# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy all stacks
npx cdk deploy --all --require-approval never
```

#### 5. Access Application
The deployment outputs a `WebUrl` - this is your application URL.

### Environment-Specific Deployments

#### Development Environment
```typescript
export const parameter: Parameter = {
  appRegion: 'us-east-1',
  provisionedConcurrency: 0,  // No warm instances
  // ... other dev settings
};
```

#### Production Environment
```typescript
export const parameter: Parameter = {
  appRegion: 'us-east-1',
  provisionedConcurrency: 10,  // Higher concurrency
  // ... production settings
};
```

### Monitoring & Observability

**CloudWatch Metrics:**
- Lambda invocations, duration, errors
- DynamoDB read/write capacity
- CloudFront cache hit ratio
- S3 request metrics

**CloudWatch Logs:**
- Lambda function logs
- CloudFront access logs
- WAF logs

**X-Ray Tracing:**
- Request tracing through services
- Performance bottleneck identification

## Customization Options

### UI/UX Customization

#### Theme Customization
```typescript
// Modify web/src/contexts/ThemeContext.tsx
const themes = {
  light: { /* custom light theme */ },
  dark: { /* custom dark theme */ },
  custom: { /* your custom theme */ }
};
```

#### Component Styling
```css
/* Modify web/src/index.css or component-specific CSS */
.chat-message {
  /* Custom message styling */
}
```

### Model Configuration

#### Adding New Models
```typescript
// In parameter.ts
models: [
  {
    id: 'your-custom-model-id',
    region: 'us-east-1',
    displayName: 'Custom Model'
  }
]
```

#### Model-Specific Parameters
```python
# In streaming_service.py
model_params = {
    "model_id": request.modelId,
    "boto_session": session,
    "max_tokens": 4096,
    "temperature": 0.7,  # Add custom parameters
    "top_p": 0.9
}
```

### Tool Integration

#### Adding Custom Tools
```python
# In tools.py
@tool
def custom_tool(parameter: str) -> str:
    """Custom tool description
    
    Args:
        parameter: Tool parameter description
    """
    # Tool implementation
    return result
```

#### MCP Server Integration
```python
# Add new MCP server in streaming_service.py
custom_mcp_client = MCPClient(
    lambda: stdio_client(
        StdioServerParameters(
            command="python",
            args=["-m", "your.mcp.server"],
            env={"CUSTOM_ENV": "value"}
        )
    )
)
```

### Security Customization

#### WAF Rules
```typescript
// Modify cdk/lib/waf-stack.ts
const customRule = new wafv2.CfnWebACL.RuleProperty({
  name: 'CustomRule',
  priority: 1,
  statement: {
    // Custom WAF rule logic
  },
  action: { allow: {} }
});
```

#### Authentication
```typescript
// Modify Cognito settings in strands-chat-stack.ts
const userPool = new UserPool(this, 'UserPool', {
  selfSignUpEnabled: false,  // Disable signup
  mfa: MfaMode.REQUIRED,     // Require MFA
  // ... other settings
});
```

## Troubleshooting

### Common Issues

#### 1. Lambda Cold Starts
**Symptoms:** Slow initial responses
**Solutions:**
- Increase `provisionedConcurrency` in parameter.ts
- Optimize Docker image size
- Use Lambda SnapStart (when available for containers)

#### 2. DynamoDB Throttling
**Symptoms:** 400 errors, slow database operations
**Solutions:**
- Enable auto-scaling
- Optimize query patterns
- Use batch operations

#### 3. S3 Upload Failures
**Symptoms:** File upload errors
**Solutions:**
- Check CORS configuration
- Verify presigned URL expiration
- Validate file size limits

#### 4. Bedrock Access Denied
**Symptoms:** Model access errors
**Solutions:**
- Enable model access in Bedrock console
- Verify IAM permissions
- Check region availability

#### 5. CloudFront Caching Issues
**Symptoms:** Stale content, API caching
**Solutions:**
- Create cache invalidation
- Review cache policies
- Check origin request policies

### Debugging Tools

#### Backend Debugging
```python
# Add logging in Python code
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

#### Frontend Debugging
```typescript
// Browser developer tools
console.log("Debug info", data);

// React DevTools
// Network tab for API calls
// Application tab for local storage
```

#### Infrastructure Debugging
```bash
# CDK debugging
npx cdk diff --verbose
npx cdk synth --verbose

# CloudFormation events
aws cloudformation describe-stack-events --stack-name StrandsChatStack
```

### Performance Optimization

#### Lambda Optimization
- Use provisioned concurrency for consistent performance
- Optimize container image size
- Implement connection pooling for external services

#### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization
- Bundle size analysis

#### Database Optimization
- Efficient query patterns
- Proper indexing strategy
- Connection pooling

### Monitoring & Alerting

#### CloudWatch Alarms
```typescript
// Example alarm for Lambda errors
new Alarm(this, 'LambdaErrorAlarm', {
  metric: handler.metricErrors(),
  threshold: 10,
  evaluationPeriods: 2
});
```

#### Custom Metrics
```python
# Custom application metrics
import boto3
cloudwatch = boto3.client('cloudwatch')
cloudwatch.put_metric_data(
    Namespace='StrandsChat',
    MetricData=[{
        'MetricName': 'CustomMetric',
        'Value': 1.0
    }]
)
```

This comprehensive documentation provides a complete technical overview of the Strands Agents Chat application, covering all aspects from architecture to deployment and customization. The modular design and extensive configuration options make it suitable for various use cases and deployment scenarios.