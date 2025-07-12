// LLM API Configuration
// Choose your preferred LLM provider and add your API key

export const LLM_CONFIG = {
  // Choose your provider: 'openai', 'anthropic', 'google', 'local'
  provider: 'google',
  
  // API Keys (add your actual keys here)
  apiKeys: {
    openai: 'your-openai-api-key-here',
    anthropic: 'your-anthropic-api-key-here',
    google: 'your-gemini-api-key-here' // Use environment variable GOOGLE_API_KEY for security
  },
  
  // API Endpoints
  endpoints: {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    google: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  },
  
  // Model configurations
  models: {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-sonnet-20240229',
    google: 'gemini-2.0-flash'
  }
};

// Environment variable support
export const getApiKey = (provider) => {
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  return envKey || LLM_CONFIG.apiKeys[provider];
}; 