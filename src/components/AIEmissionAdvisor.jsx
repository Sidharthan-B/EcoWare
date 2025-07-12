import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react';
import { LLM_CONFIG, getApiKey } from '../config/llm-config';

const AIEmissionAdvisor = ({ warehouseData, totalCarbon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: `Hello! I'm your AI Emission Advisor. I can see your warehouse has a total carbon footprint of ${totalCarbon.toFixed(1)} kg CO₂. Would you like personalized recommendations to reduce your emissions?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, totalCarbon]);

  const generateAIRecommendations = async (userMessage) => {
    setIsLoading(true);
    
    try {
      // Use real LLM API if configured, otherwise fall back to local analysis
      if (LLM_CONFIG.provider !== 'local') {
        const recommendations = await callRealLLMAPI(userMessage);
        setIsLoading(false);
        return recommendations;
      } else {
        // Use local analysis (current implementation)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        const recommendations = analyzeWarehouseData(userMessage);
        setIsLoading(false);
        return recommendations;
      }
    } catch (error) {
      console.error('LLM API Error:', error);
      setIsLoading(false);
      // Fallback to local analysis if API fails
      const fallbackResponse = analyzeWarehouseData(userMessage);
      return fallbackResponse + '\n\n⚠️ Note: Using local analysis due to API connection issues.';
    }
  };

  // Real LLM API integration with multiple providers
  const callRealLLMAPI = async (userMessage) => {
    const provider = LLM_CONFIG.provider;
    const apiKey = getApiKey(provider);
    
    if (!apiKey || apiKey.includes('your-')) {
      throw new Error(`Please configure your ${provider} API key in llm-config.js`);
    }

    const systemPrompt = `You are an AI Emission Advisor for warehouses. Analyze the user's warehouse data and provide personalized recommendations to reduce carbon emissions. 

Current warehouse data:
${warehouseData.map(item => `- ${item.name}: ${item.carbon.toFixed(1)} kg CO₂`).join('\n')}
Total carbon footprint: ${totalCarbon.toFixed(1)} kg CO₂

Provide practical, actionable advice with specific examples and cost estimates when possible. Keep responses concise but informative.`;

    switch (provider) {
      case 'openai':
        return await callOpenAI(userMessage, systemPrompt, apiKey);
      case 'anthropic':
        return await callAnthropic(userMessage, systemPrompt, apiKey);
      case 'google':
        return await callGoogle(userMessage, systemPrompt, apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  };

  const callOpenAI = async (userMessage, systemPrompt, apiKey) => {
    const response = await fetch(LLM_CONFIG.endpoints.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: LLM_CONFIG.models.openai,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const callAnthropic = async (userMessage, systemPrompt, apiKey) => {
    const response = await fetch(LLM_CONFIG.endpoints.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: LLM_CONFIG.models.anthropic,
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  };

  const callGoogle = async (userMessage, systemPrompt, apiKey) => {
    const response = await fetch(`${LLM_CONFIG.endpoints.google}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userMessage }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const analyzeWarehouseData = (userMessage) => {
    const analysis = {
      highestEmissions: null,
      recommendations: [],
      specificTips: [],
      dataInsights: {},
      trends: {},
      benchmarks: {}
    };

    // Comprehensive data analysis
    const sortedData = [...warehouseData].sort((a, b) => b.carbon - a.carbon);
    analysis.highestEmissions = sortedData[0];
    
    // Calculate data insights
    const totalEmissions = warehouseData.reduce((sum, item) => sum + item.carbon, 0);
    const avgEmissions = totalEmissions / warehouseData.length;
    const emissionDistribution = warehouseData.map(item => ({
      name: item.name,
      percentage: ((item.carbon / totalEmissions) * 100).toFixed(1),
      carbon: item.carbon
    }));

    // Industry benchmarks (kg CO2 per unit)
    const benchmarks = {
      'Electricity': { low: 0.3, medium: 0.5, high: 0.8 },
      'Diesel': { low: 2.0, medium: 2.68, high: 3.5 },
      'Plastic Packaging': { low: 0.2, medium: 0.3, high: 0.5 },
      'Cardboard': { low: 0.3, medium: 0.5, high: 0.8 }
    };

    // Performance analysis
    warehouseData.forEach(item => {
      const name = item.name.toLowerCase();
      const carbon = item.carbon;
      const benchmark = benchmarks[item.name] || benchmarks['Electricity'];
      
      // Determine performance level
      let performance = 'Good';
      if (carbon > benchmark.high) performance = 'Needs Improvement';
      else if (carbon > benchmark.medium) performance = 'Average';
      
      analysis.dataInsights[item.name] = {
        carbon,
        performance,
        benchmark: benchmark.medium,
        efficiency: ((benchmark.medium / carbon) * 100).toFixed(1)
      };
      
      if (name.includes('electricity') && carbon > 0) {
        analysis.recommendations.push({
          category: 'Electricity',
          tips: [
            'Switch to LED lighting throughout the warehouse',
            'Install motion sensors for automatic lighting control',
            'Consider solar panels for renewable energy',
            'Optimize HVAC systems and set temperature controls',
            'Use energy-efficient equipment and machinery'
          ]
        });
      }
      
      if (name.includes('diesel') && carbon > 0) {
        analysis.recommendations.push({
          category: 'Diesel',
          tips: [
            'Optimize delivery routes to reduce fuel consumption',
            'Consider electric or hybrid vehicles for local deliveries',
            'Implement eco-driving training for drivers',
            'Regular vehicle maintenance to improve fuel efficiency',
            'Use route optimization software'
          ]
        });
      }
      
      if (name.includes('plastic packaging') && carbon > 0) {
        analysis.recommendations.push({
          category: 'Plastic Packaging',
          tips: [
            'Switch to biodegradable or recyclable packaging materials',
            'Reduce packaging size and weight where possible',
            'Implement a packaging reuse program',
            'Use bulk packaging for larger orders',
            'Partner with suppliers who offer eco-friendly packaging'
          ]
        });
      }
      
      if (name.includes('cardboard') && carbon > 0) {
        analysis.recommendations.push({
          category: 'Cardboard',
          tips: [
            'Implement a cardboard recycling program',
            'Use reusable containers instead of single-use cardboard',
            'Optimize packaging design to reduce material usage',
            'Partner with local recycling facilities',
            'Consider returnable packaging systems'
          ]
        });
      }
    });

    // Generate comprehensive response based on user query
    let response = '';
    const query = userMessage.toLowerCase();
    
    if (query.includes('data analysis') || query.includes('analytics') || query.includes('insights')) {
      response = `📊 **Comprehensive Data Analytics Report**\n\n`;
      
      // Overall summary
      response += `🏭 **Total Carbon Footprint**: ${totalCarbon.toFixed(1)} kg CO₂\n`;
      response += `📈 **Average per Category**: ${avgEmissions.toFixed(1)} kg CO₂\n`;
      response += `🎯 **Highest Emission Source**: ${analysis.highestEmissions?.name} (${analysis.highestEmissions?.carbon.toFixed(1)} kg CO₂)\n\n`;
      
      // Emission distribution
      response += `📊 **Emission Distribution**:\n`;
      emissionDistribution.forEach(item => {
        response += `• ${item.name}: ${item.carbon.toFixed(1)} kg CO₂ (${item.percentage}%)\n`;
      });
      response += '\n';
      
      // Performance analysis
      response += `📋 **Performance Analysis**:\n`;
      Object.entries(analysis.dataInsights).forEach(([name, insight]) => {
        const status = insight.performance === 'Good' ? '✅' : 
                      insight.performance === 'Average' ? '⚠️' : '❌';
        response += `${status} ${name}: ${insight.performance} (${insight.efficiency}% efficiency)\n`;
      });
      response += '\n';
      
      // Industry comparison
      response += `🏆 **Industry Benchmark Comparison**:\n`;
      Object.entries(analysis.dataInsights).forEach(([name, insight]) => {
        const benchmark = benchmarks[name] || benchmarks['Electricity'];
        const comparison = insight.carbon > benchmark.high ? 'Above Industry Average' :
                          insight.carbon < benchmark.low ? 'Below Industry Average' : 'Industry Average';
        response += `• ${name}: ${comparison}\n`;
      });
      
    } else if (query.includes('recommend') || query.includes('suggestion')) {
      response = `🎯 **Strategic Recommendations Based on Data Analysis**\n\n`;
      
      if (analysis.highestEmissions) {
        response += `🔥 **Priority Focus**: ${analysis.highestEmissions.name} (${analysis.highestEmissions.carbon.toFixed(1)} kg CO₂)\n`;
        response += `Impact: ${((analysis.highestEmissions.carbon / totalCarbon) * 100).toFixed(1)}% of total emissions\n\n`;
      }
      
      analysis.recommendations.forEach(rec => {
        const insight = analysis.dataInsights[rec.category];
        response += `📋 **${rec.category}** (${insight?.performance} Performance):\n`;
        rec.tips.slice(0, 3).forEach(tip => {
          response += `• ${tip}\n`;
        });
        response += '\n';
      });
      
      response += `💡 **Data-Driven Quick Wins**:\n`;
      response += `• Implement smart monitoring for ${analysis.highestEmissions?.name}\n`;
      response += `• Set up automated efficiency tracking\n`;
      response += `• Establish baseline metrics for improvement tracking\n`;
      
    } else if (query.includes('target') || query.includes('goal')) {
      const targetReduction = totalCarbon * 0.2; // 20% reduction target
      const targetEmissions = totalCarbon - targetReduction;
      
      response = `🎯 **Data-Driven Emission Reduction Targets**\n\n`;
      response += `📊 **Current State**:\n`;
      response += `• Total emissions: ${totalCarbon.toFixed(1)} kg CO₂\n`;
      response += `• Average per category: ${avgEmissions.toFixed(1)} kg CO₂\n\n`;
      
      response += `🎯 **Recommended Targets**:\n`;
      response += `• 20% reduction target: ${targetEmissions.toFixed(1)} kg CO₂\n`;
      response += `• Monthly reduction needed: ${(targetReduction / 12).toFixed(1)} kg CO₂\n\n`;
      
      response += `📈 **Priority Actions Based on Data**:\n`;
      if (analysis.highestEmissions) {
        const highestReduction = analysis.highestEmissions.carbon * 0.25;
        response += `• Focus on ${analysis.highestEmissions.name}: Reduce by ${highestReduction.toFixed(1)} kg CO₂\n`;
      }
      response += `• Implement efficiency measures across all categories\n`;
      response += `• Set up monthly tracking and reporting\n`;
      
    } else if (query.includes('cost') || query.includes('savings') || query.includes('roi')) {
      const potentialSavings = totalCarbon * 0.15 * 50; // Rough estimate of cost savings
      const carbonPrice = 25; // USD per ton CO2
      const carbonCost = (totalCarbon / 1000) * carbonPrice;
      
      response = `💰 **Comprehensive Cost-Benefit Analysis**\n\n`;
      response += `📊 **Current Financial Impact**:\n`;
      response += `• Carbon cost: $${carbonCost.toFixed(0)}/year\n`;
      response += `• Potential savings: $${potentialSavings.toFixed(0)}/year\n`;
      response += `• Net benefit: $${(potentialSavings - carbonCost).toFixed(0)}/year\n\n`;
      
      response += `📈 **ROI Analysis**:\n`;
      response += `• Payback period: 6-18 months\n`;
      response += `• 5-year savings: $${(potentialSavings * 5).toFixed(0)}\n`;
      response += `• Carbon credit potential: $${(totalCarbon * 0.2 * 15).toFixed(0)}/year\n\n`;
      
      response += `💡 **Investment Opportunities**:\n`;
      response += `• Energy efficiency training: $500 setup (ROI: 3 months)\n`;
      response += `• LED lighting upgrade: $2,000-5,000 (ROI: 12 months)\n`;
      response += `• Route optimization software: $1,000/year (ROI: 6 months)\n`;
      response += `• Solar panel installation: $15,000-30,000 (ROI: 5-8 years)\n`;
      
    } else if (query.includes('trend') || query.includes('forecast')) {
      response = `📈 **Emission Trends & Forecasting**\n\n`;
      response += `📊 **Current Data Analysis**:\n`;
      response += `• Total emissions: ${totalCarbon.toFixed(1)} kg CO₂\n`;
      response += `• Emission intensity: ${(totalCarbon / warehouseData.length).toFixed(1)} kg CO₂ per category\n\n`;
      
      response += `🔮 **Projected Trends** (based on current data):\n`;
      response += `• 6-month projection: ${(totalCarbon * 1.05).toFixed(1)} kg CO₂ (+5%)\n`;
      response += `• 12-month projection: ${(totalCarbon * 1.1).toFixed(1)} kg CO₂ (+10%)\n`;
      response += `• With 20% reduction: ${(totalCarbon * 0.8).toFixed(1)} kg CO₂ (-20%)\n\n`;
      
      response += `📋 **Trend Analysis**:\n`;
      response += `• ${analysis.highestEmissions?.name} shows highest impact potential\n`;
      response += `• Efficiency improvements could reduce costs by 15-25%\n`;
      response += `• Regular monitoring recommended for trend tracking\n`;
      
    } else {
      response = `🤖 **AI Data Analytics Assistant**\n\n`;
      response += `I can provide comprehensive analysis of your warehouse emissions data:\n\n`;
      response += `📊 **Data Analytics**: Deep insights into your emission patterns\n`;
      response += `📋 **Strategic Recommendations**: Data-driven improvement suggestions\n`;
      response += `🎯 **Target Setting**: Realistic reduction goals based on your data\n`;
      response += `💰 **Cost Analysis**: ROI and financial impact calculations\n`;
      response += `📈 **Trends & Forecasting**: Future projections and trend analysis\n\n`;
      response += `💡 **Try asking**:\n`;
      response += `• "Give me a data analysis"\n`;
      response += `• "What are the trends?"\n`;
      response += `• "Show me cost-benefit analysis"\n`;
      response += `• "What are my emission targets?"\n`;
    }

    return response;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIRecommendations(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot size={20} />
              <span className="font-semibold">AI Emission Advisor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && <Bot size={16} className="mt-1 flex-shrink-0" />}
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    {message.type === 'user' && <User size={16} className="mt-1 flex-shrink-0" />}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot size={16} />
                    <Loader size={16} className="animate-spin" />
                    <span className="text-sm">Analyzing your data...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about reducing emissions..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIEmissionAdvisor; 