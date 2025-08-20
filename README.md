<div align="center">

# 🤖 Strands Agents Chat Base

<p align="center">
  <img src="https://img.shields.io/badge/AI%20Powered-Bedrock%20AgentCore-blueviolet?style=for-the-badge&logo=amazon-aws" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT--0-blue?style=for-the-badge" alt="License" />
</p>

*A cutting-edge, full-stack AI chat application powered by Amazon Bedrock, Strands Agents, and Bedrock AgentCore*

<p align="center">
  <strong>🚀 Serverless • 🎯 Scalable • 🔒 Secure • 🎨 Beautiful</strong>
</p>

[![AWS](https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Python](https://img.shields.io/badge/Python_3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 📸 Screenshots

<div align="center">
  <img src="img/screenshot01.png" alt="Chat Interface" width="45%" style="margin-right: 2%;" />
  <img src="img/screenshot02.png" alt="Mobile View" width="45%" style="margin-left: 2%;" />
</div>

---

## ✨ Features

<div align="center">
  <h3>🎯 A production-ready foundation for building sophisticated AI chat applications</h3>
</div>

<table align="center">
<tr>
<td align="center" width="33%">

### 🏗️ **Enterprise Architecture**
Clean, maintainable codebase with serverless scalability and AWS best practices

</td>
<td align="center" width="33%">

### 🎨 **Premium UI/UX**
Polished chat interface with intuitive user experience and responsive design

</td>
<td align="center" width="33%">

### 🔧 **Highly Extensible**
Ready for customization with MCP, A2A, Multi Agents, and Bedrock AgentCore

</td>
</tr>
<tr>
<td align="center">

### 🤖 **Advanced AI Capabilities**
Multi-modal conversations with image, video, and document support

</td>
<td align="center">

### 🔒 **Security First**
Built-in authentication, authorization, and WAF protection

</td>
<td align="center">

### 📱 **Cross-Platform**
Optimized for desktop, tablet, and mobile devices

</td>
</tr>
</table>

---

## 🏛️ Architecture

<div align="center">
  <img src="img/arch.drawio.png" alt="System Architecture" width="50%" />
</div>

---

## 🛠️ Built-in Tools

<div align="center">

| Tool | Description | Technology |
|------|-------------|------------|
| 💬 **Multi-modal Chat** | Support for images, videos, and documents | Amazon Bedrock |
| 🧠 **Deep Reasoning** | Advanced AI reasoning for complex problem solving | Amazon Bedrock |
| 🎨 **Image Generation** | AI-powered image creation | Nova Canvas MCP |
| � **AWS Doceumentation Search** | Search and access AWS documentation | AWS Documentation MCP |
| 🔍 **Web Search** | Real-time web search capabilities | Tavily API |
| 🌐 **Web Browser** | Browse and analyze web pages in real-time | Bedrock AgentCore |
| 💻 **CodeInterpreter** | Execute and analyze code with advanced capabilities | Bedrock AgentCore |

</div>

---

## 🚀 Quick Start

<div align="center">
  <h3>⚡ Get your AI chat application running in minutes</h3>
</div>

### Prerequisites

<table>
<tr>
<td align="center">

**🔧 Required Tools**
- Node.js 18+
- Python 3.13+
- AWS CLI configured
- CDK CLI installed

</td>
<td align="center">

**☁️ AWS Services**
- AWS Account with appropriate permissions
- Amazon Bedrock access enabled
- (Optional) Tavily API key for web search

</td>
</tr>
</table>

## 🚀 Deployment Guide

### Step 1: (Optional) Create Tavily API Key Secret

<details>
<summary>Click to expand Tavily API setup instructions</summary>

1. Open [AWS Secrets Manager](https://console.aws.amazon.com/secretsmanager)
2. Click **"Store a new secret"**
3. Select **"Other type of secret"**
4. Choose **"Plaintext"** and paste your Tavily API Key
5. Create the secret and copy the **Secret ARN**

</details>

### Step 2: (Required) Configure Parameters

```bash
# Navigate to CDK directory
cd cdk

# Install dependencies
npm ci

# Copy the parameter template
cp parameter.template.ts parameter.ts

# Edit parameter.ts with your configuration
# Note: If tavilyApiKeySecretArn is null, web search tool will be disabled
```

### Step 3: (Required) Deploy with CDK

```bash
# Bootstrap CDK (run once per AWS account/region)
npx cdk bootstrap

# Deploy all stacks
npx cdk deploy --all --require-approval never
```

🎉 **Access your application** using the `WebUrl` from the deployment output!

---

## 💻 Development

### Frontend Development

For frontend development, you can run the development server locally while connecting to your deployed backend:

```bash
# Navigate to web directory
cd web

# Install dependencies
npm ci

# Start development server
npm run dev
```

The development server will:
- 🚀 Start at `http://localhost:5173`
- 🔗 Automatically import necessary values from the `StrandsChat` stack output
- 🔄 Enable hot reload for rapid development

### Pre-commit Checks

Before committing your changes, ensure code quality by running the pre-check script:

```bash
# Run pre-commit checks
./pre_check.sh
```

This script will validate your code formatting, run tests, and ensure everything is ready for commit.

---

## ⚙️ Customization

### 🛡️ WAF Configuration (Access Restrictions)

The WAF settings are defined in `cdk/lib/waf-stack.ts`. Customize this file to modify security rules.

> **Default behavior**: Allows access from all IP addresses and countries

**IP Restriction Example:**
```typescript
// Add IP allowlist in waf-stack.ts
const ipSet = new wafv2.CfnIPSet(this, 'AllowedIPs', {
  addresses: ['192.168.1.0/24', '10.0.0.0/8'],
  ipAddressVersion: 'IPV4',
  scope: 'CLOUDFRONT'
});
```

**GEO Restriction Example:**
```typescript
// Add country-based access control in waf-stack.ts
// Add geoMatchStatement to your WAF rule's statement
const geoRule = new wafv2.CfnWebACL.RuleProperty({
  name: 'GeoRestriction',
  priority: 1,
  statement: {
    geoMatchStatement: {
      countryCodes: ['US', 'JP', 'CA'], // Allow only these countries
    },
  },
  action: {
    allow: {},
  },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'GeoRestriction',
  },
});
```

> **Country Codes**: Use ISO 3166-1 alpha-2 country codes (e.g., 'US' for United States, 'JP' for Japan)

### 🔐 Disable Cognito Signup

If you want to disable the Cognito signup functionality and restrict user registration:

**Backend Configuration:**
1. Open `cdk/lib/strands-chat-stack.ts`
2. Find the UserPool configuration
3. Change `selfSignUpEnabled` from `true` to `false`

```typescript
// In strands-chat-stack.ts
const userPool = new UserPool(this, 'UserPool', {
  selfSignUpEnabled: false, // Change from true to false
  // ... other configurations
});
```

**Frontend Configuration:**
1. Open `web/src/components/AuthWithUserPool.tsx`
2. Add the `hideSignup={true}` option to the `<Authenticator>` component

```tsx
// In AuthWithUserPool.tsx
<Authenticator hideSignup={true}>
  {/* ... existing content */}
</Authenticator>
```

> **Note**: After making these changes, redeploy the CDK stack for backend changes to take effect.

---

## 🏗️ Technology Stack

<div align="center">
  <h3>🔥 Built with cutting-edge technologies</h3>
</div>

<table align="center">
<tr>
<th align="center">🎨 Frontend</th>
<th align="center">⚡ Backend</th>
<th align="center">☁️ Infrastructure</th>
<th align="center">🤖 AI/ML</th>
</tr>
<tr>
<td align="center">

**React 19**  
**TypeScript**  
**Tailwind CSS 4.x**  
**Vite**  
**SWR**  

</td>
<td align="center">

**Python 3.13**  
**FastAPI**  
**Strands Agents 1.1.0**  
**Uvicorn**  
**Boto3**  

</td>
<td align="center">

**AWS CDK 2.x**  
**Lambda**  
**DynamoDB**  
**S3**  
**CloudFront**  

</td>
<td align="center">

**Amazon Bedrock**  
**Bedrock AgentCore**  
**Claude Models**  
**Nova Canvas**  
**MCP Protocol**  

</td>
</tr>
</table>

### 🔧 Development Tools

<div align="center">

| Category | Tools |
|----------|-------|
| **Code Quality** | ESLint, Prettier, Ruff, TypeScript |
| **Testing** | Jest, React Testing Library, Pytest |
| **Build & Deploy** | Vite, esbuild, AWS CDK, Lambda Web Adapter |
| **Security** | AWS WAF, Cognito, IAM Policies, CORS |

</div>

---

## 🎯 Use Cases

<div align="center">

| Scenario | Description | Benefits |
|----------|-------------|----------|
| 🏢 **Enterprise Chat** | Internal AI assistant for employees | Increased productivity, knowledge sharing |
| 🎓 **Educational Platform** | AI tutor for students and educators | Personalized learning, 24/7 availability |
| 💼 **Customer Support** | Intelligent customer service chatbot | Reduced response time, improved satisfaction |
| 🔬 **Research Assistant** | AI-powered research and analysis tool | Faster insights, comprehensive data analysis |
| 🛠️ **Developer Tools** | Code analysis and debugging assistant | Enhanced development workflow |

</div>

---

## 📊 Performance & Scalability

<table align="center">
<tr>
<td align="center" width="25%">

### ⚡ **Response Time**
< 200ms average  
Streaming responses

</td>
<td align="center" width="25%">

### 📈 **Scalability**
Auto-scaling Lambda  
DynamoDB on-demand

</td>
<td align="center" width="25%">

### 💰 **Cost Efficient**
Pay-per-use model  
Serverless architecture

</td>
<td align="center" width="25%">

### 🌍 **Global CDN**
CloudFront distribution  
Edge locations worldwide

</td>
</tr>
</table>

---

## 📁 Project Structure

```
├── 🐍 api/                    # Python FastAPI backend
│   ├── main.py               # FastAPI application entry point
│   ├── services/             # Business logic and AI integration
│   ├── routers/              # API route definitions
│   └── pyproject.toml        # Python dependencies
├── ☁️ cdk/                    # AWS CDK infrastructure
│   ├── lib/                  # Stack definitions
│   ├── bin/                  # CDK app entry points
│   └── edge/                 # Lambda@Edge functions
├── ⚛️ web/                    # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   └── types/            # TypeScript definitions
│   └── dist/                 # Build output
└── 📖 README.md              # Project documentation
```

### 🔍 Key Files

<div align="center">

| File | Purpose | Technology |
|------|---------|------------|
| `api/main.py` | Main FastAPI application with all routes | Python + FastAPI |
| `cdk/lib/strands-chat-stack.ts` | Primary infrastructure stack | AWS CDK + TypeScript |
| `web/src/App.tsx` | Main React application component | React + TypeScript |
| `web/src/pages/Chat.tsx` | Chat interface implementation | React + Tailwind CSS |

</div>

---

## 🤝 Contributing

<div align="center">
  <h3>We welcome contributions from the community!</h3>
</div>

<table align="center">
<tr>
<td align="center" width="33%">

### 🐛 **Bug Reports**
Found a bug? Please open an issue with detailed reproduction steps.

</td>
<td align="center" width="33%">

### 💡 **Feature Requests**
Have an idea? We'd love to hear about it in our discussions.

</td>
<td align="center" width="33%">

### 🔧 **Pull Requests**
Ready to contribute code? Check our contributing guidelines.

</td>
</tr>
</table>

**Before contributing:**
1. 📖 Read our [Contributing Guidelines](CONTRIBUTING.md)
2. 🔍 Check existing issues and PRs
3. 🧪 Run `./pre_check.sh` before submitting
4. ✅ Ensure all tests pass

---

## 🛡️ Security

<div align="center">

**Security is our top priority. This application includes:**

🔐 **Authentication** • 🛡️ **Authorization** • 🌐 **WAF Protection** • 🔒 **Data Encryption**

</div>

For security issues, please see our [Security Policy](CONTRIBUTING.md#security-issue-notifications).

---

## 📄 License

<div align="center">

**MIT-0 License** - See the [LICENSE](LICENSE) file for details.

*This means you can use this code for any purpose, including commercial applications, without any restrictions.*

---

<h3>⭐ If this project helped you, please consider giving it a star!</h3>

[![GitHub stars](https://img.shields.io/github/stars/yourusername/strands-agents-chat?style=social)](https://github.com/yourusername/strands-agents-chat)

**Built with ❤️ by the AWS community**

</div>
