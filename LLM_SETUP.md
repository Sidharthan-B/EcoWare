# 🤖 LLM API Setup Guide

## Quick Setup

### 1. Choose Your LLM Provider

Edit `src/config/llm-config.js` and change the provider:

```javascript
provider: 'openai', // or 'anthropic', 'google', 'local'
```

### 2. Get Your API Key

#### **OpenAI (GPT-3.5/4)**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and get your API key
3. Add it to `llm-config.js`:
```javascript
apiKeys: {
  openai: 'sk-your-actual-api-key-here',
  // ...
}
```

#### **Anthropic (Claude)**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and get your API key
3. Add it to `llm-config.js`:
```javascript
apiKeys: {
  anthropic: 'sk-ant-your-actual-api-key-here',
  // ...
}
```

#### **Google (Gemini)**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to `llm-config.js`:
```javascript
apiKeys: {
  google: 'your-actual-google-api-key-here',
  // ...
}
```

### 3. Environment Variables (Optional)

For better security, use environment variables:

Create a `.env` file in your project root:
```env
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=your-google-key-here
```

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Open the chat widget (bottom-right corner)
3. Ask questions like:
   - "How can I reduce my emissions?"
   - "What should I focus on first?"
   - "Give me cost analysis"

## 🔧 Configuration Options

### Models Available
- **OpenAI**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`
- **Anthropic**: `claude-3-sonnet`, `claude-3-haiku`, `claude-3-opus`
- **Google**: `gemini-pro`, `gemini-pro-vision`

### Customization
You can modify the system prompt in `AIEmissionAdvisor.jsx` to:
- Change the AI's personality
- Add specific industry knowledge
- Include cost analysis preferences
- Set response length limits

## 💰 Cost Estimates

### OpenAI
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens

### Anthropic
- Claude-3-Sonnet: ~$0.003 per 1K tokens
- Claude-3-Haiku: ~$0.00025 per 1K tokens

### Google
- Gemini Pro: ~$0.0005 per 1K tokens

## 🛡️ Security Notes

1. **Never commit API keys** to version control
2. Use environment variables for production
3. Set up API key rotation
4. Monitor usage to avoid unexpected charges

## 🚀 Production Deployment

For production deployment (Netlify, Vercel, etc.):

1. Add environment variables in your hosting platform
2. Set `provider: 'openai'` (or your chosen provider)
3. Remove API keys from `llm-config.js`
4. Deploy with environment variables

## 🔄 Fallback System

The system automatically falls back to local analysis if:
- API key is not configured
- API call fails
- Rate limits are exceeded
- Network issues occur

This ensures your app always works, even without API access! 