# Project Structure

## Root Directory Layout
```
├── api/           # Python FastAPI backend
├── cdk/           # AWS CDK infrastructure code
├── web/           # React frontend application
└── README.md      # Project documentation
```

## API Directory (`api/`)
```
api/
├── main.py        # FastAPI application entry point
├── pyproject.toml # Python dependencies and project config
├── run.sh         # Lambda execution script
├── .python-version # Python version specification
└── uv.lock        # Dependency lock file
```

### API Architecture
- **main.py**: Contains all FastAPI routes, models, and business logic
- **Endpoints**: `/api/chat`, `/api/streaming`, `/api/file/upload`, `/api/file/download`
- **Authentication**: Uses Cognito user tokens via headers (`x-user-sub`)
- **Storage Pattern**: DynamoDB for chat data, S3 for file storage
- **AI Integration**: Strands Agents with Bedrock Claude model

## CDK Directory (`cdk/`)
```
cdk/
├── bin/           # CDK app entry points
├── lib/           # Stack definitions
│   ├── strands-chat-stack.ts  # Main application stack
│   └── waf-stack.ts           # WAF security stack
├── edge/          # Lambda@Edge functions
│   └── originRequest/         # Origin request handler
├── cdk.out/       # CDK synthesis output
└── package.json   # Node.js dependencies
```

### Infrastructure Components
- **StrandsChatStack**: Main stack with Lambda, DynamoDB, S3, CloudFront
- **WAF Stack**: Web Application Firewall configuration
- **Lambda@Edge**: Origin request processing for API routing

## Web Directory (`web/`)
```
web/
├── src/
│   ├── components/    # Reusable React components
│   │   ├── AuthWithUserPool.tsx
│   │   ├── Drawer.tsx
│   │   ├── Header.tsx
│   │   ├── Markdown.tsx
│   │   └── Message.tsx
│   ├── hooks/         # Custom React hooks
│   │   ├── useApi.ts
│   │   ├── useChatApi.ts
│   │   ├── useChatStream.ts
│   │   └── useChats.ts
│   ├── pages/         # Page components
│   │   ├── Chat.tsx
│   │   └── NotFound.tsx
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Main application component
├── public/            # Static assets
└── dist/              # Build output
```

### Frontend Architecture
- **Component-based**: Modular React components with TypeScript
- **Hook-based State**: Custom hooks for API integration and state management
- **SWR Integration**: Data fetching and caching via SWR
- **Tailwind Styling**: Utility-first CSS framework

## Key Conventions
- **File Naming**: kebab-case for directories, PascalCase for React components
- **Import Structure**: Relative imports within modules, absolute for cross-module
- **Environment Variables**: Prefixed with `VITE_` for frontend, standard for backend
- **API Routes**: RESTful design with `/api/` prefix
- **Authentication**: JWT tokens from Cognito passed via headers