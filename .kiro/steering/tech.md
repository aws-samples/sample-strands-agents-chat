# Technology Stack

## Backend (API)
- **Language**: Python 3.13
- **Framework**: FastAPI with Uvicorn
- **AI Framework**: Strands Agents (1.1.0) with Amazon Bedrock
- **Database**: DynamoDB with GSI indexes
- **Storage**: Amazon S3 with CORS configuration
- **Authentication**: AWS Cognito User Pools + Identity Pools
- **Deployment**: AWS Lambda with Lambda Web Adapter layer

## Frontend (Web)
- **Language**: TypeScript
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS 4.x
- **State Management**: SWR for data fetching
- **Routing**: React Router DOM
- **Authentication**: AWS Amplify UI React
- **Build Tool**: Vite with TypeScript

## Infrastructure (CDK)
- **Language**: TypeScript
- **Framework**: AWS CDK 2.x
- **Distribution**: CloudFront with Lambda@Edge
- **Security**: WAF integration, IAM policies
- **Bundling**: esbuild for Lambda@Edge functions

## Common Commands

### API Development
```bash
cd api
# Install dependencies
uv sync
# Run locally
python main.py
# Or use the shell script
./run.sh
```

### Web Development
```bash
cd web
# Install dependencies
npm ci
# Development server
npm run dev
# Build for production
npm run build
# Lint code
npm run lint
```

### Infrastructure
```bash
cd cdk
# Install dependencies
npm ci
# Build TypeScript
npm run build
# Deploy stack
npm run cdk deploy
# Watch for changes
npm run watch
```

## Key Dependencies
- **strands-agents**: AI agent framework for Bedrock
- **boto3**: AWS SDK for Python
- **mcp**: Model Context Protocol support
- **aws-amplify**: Frontend AWS integration
- **react-markdown**: Markdown rendering with syntax highlighting