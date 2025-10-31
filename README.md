
# AI Architecture Generator

AI-powered Azure architecture designer with Infrastructure as Code generation.

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/tmdaidevs/AIDesigner.git
cd AIDesigner-New
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure OpenAI API
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

### 4. Get your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Copy it to your `.env` file

### 5. Start development server
```bash
npm run dev
```

## 🌐 Deployment

### Vercel Deployment
1. Fork this repository
2. Connect to Vercel
3. Add environment variable: `VITE_OPENAI_API_KEY` = `your-api-key`
4. Deploy

### Netlify Deployment
1. Fork this repository
2. Connect to Netlify
3. Add environment variable in Site Settings: `VITE_OPENAI_API_KEY` = `your-api-key`
4. Deploy

## ✨ Features

- 🤖 AI-powered architecture generation
- 📊 Interactive diagram visualization  
- 🏗️ Infrastructure as Code export (Terraform, Bicep, ARM)
- 🔧 Real-time configuration
- 💾 Export capabilities

## 🔒 Security

- API keys are stored as environment variables
- Never commit `.env` files to version control
- Use platform-specific environment variable configuration for production
  