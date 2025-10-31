import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Send, Sparkles, User, Bot, Trash2, HelpCircle, UserCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { detectIntent, ChatIntent } from '../utils/intentDetection';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onGenerate: (requirements: string) => void;
  isLoading: boolean;
  components?: string[];
  description?: string;
  architecture: any;
  onArchitectureUpdate: (arch: any) => void;
  onClear: () => void;
}

export function ChatPanel({ 
  onGenerate, 
  isLoading, 
  components, 
  description, 
  architecture,
  onArchitectureUpdate,
  onClear
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const exampleRequirements = [
    "Build a real-time streaming analytics platform with event processing",
    "Create a serverless e-commerce API with payment processing and order tracking",
    "Design a machine learning data pipeline with model training and deployment",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (description && components) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.type !== 'assistant') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: description,
          timestamp: new Date(),
        }]);
      }
    }
  }, [description, components]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userInput = input.trim();
      
      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        content: userInput,
        timestamp: new Date(),
      }]);
      
      setInput('');
      
      try {
        console.log('🤖 Detecting intent for:', userInput);
        
        // Detect user intent using AI
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const intentResult = await detectIntent(userInput, !!architecture, apiKey);
        
        console.log('🎯 Intent detected:', intentResult);
        
        // Route based on detected intent
        switch (intentResult.intent) {
          case ChatIntent.GENERATE_ARCHITECTURE:
            console.log('→ Generating new architecture');
            onGenerate(userInput);
            break;
            
          case ChatIntent.MODIFY_ARCHITECTURE:
            if (!architecture) {
              addAssistantMessage("I don't see any existing architecture to modify. Would you like me to create a new one?");
              return;
            }
            console.log('→ Modifying existing architecture');
            await handleArchitectureModification(userInput);
            break;
            
          case ChatIntent.ASK_QUESTION:
            console.log('→ Answering question');
            await handleQuestion(userInput);
            break;
            
          case ChatIntent.EXPLAIN_COMPONENT:
            console.log('→ Explaining component');
            await handleComponentExplanation(userInput);
            break;
            
          case ChatIntent.GENERAL_CHAT:
            console.log('→ General chat');
            await handleGeneralChat(userInput);
            break;
            
          default:
            console.log('→ Default to architecture generation');
            onGenerate(userInput);
        }
        
      } catch (error) {
        console.error('Error processing message:', error);
        addAssistantMessage(`Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Helper function to add assistant messages
  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'assistant',
      content,
      timestamp: new Date(),
    }]);
  };

  // Handle architecture modification
  const handleArchitectureModification = async (userInput: string) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        addAssistantMessage("I need an API key configured to modify architectures. Please add your OpenAI API key to the environment variables.");
        return;
      }

      if (!architecture) {
        addAssistantMessage("I don't see any architecture to modify. Please generate an architecture first.");
        return;
      }

      addAssistantMessage("Modifying your architecture...");
      
      // Use OpenAI to understand the modification request and update architecture
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system', 
              content: `You are modifying an Azure architecture. Return ONLY valid JSON.

CURRENT ARCHITECTURE NODES:
${architecture.nodes.map(n => `- ${n.id}: ${n.label} (${n.product})`).join('\n')}

User request: ${userInput}

CRITICAL REQUIREMENTS:
1. For new edges, ONLY use existing node IDs from the list above
2. For new nodes, generate unique IDs like "service-${Date.now()}"  
3. Always include complete config objects for new Azure services
4. Use Azure-native service names in the "product" field
5. NEVER create "user" type nodes - focus only on Azure services and technical components
   DO NOT add any nodes representing people, users, or human actors

Response format:
{
  "description": "Brief description of changes",
  "modifications": [{
    "action": "add|modify|remove",
    "nodeId": "use-existing-or-generate-new-id",
    "label": "Display Name",
    "product": "Azure Service Name",
    "type": "compute|storage|database|messaging|analytics|frontend|gateway|reporting|other",
    "config": {
      "tier": "Standard|Premium|Basic",
      "region": "East US",
      "rationale": "Why this service was chosen",
      "technicalDetails": "Technical explanation",
      "features": ["feature1", "feature2", "feature3"],
      "useCases": ["usecase1", "usecase2"],
      "bestPractices": ["practice1", "practice2"]
    }
  }],
  "newEdges": [{
    "source": "existing-node-id-from-above-list",
    "target": "another-existing-or-new-node-id",
    "label": "Data flow description"
  }]
}`
            }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get modification suggestions');
      }

      const result = await response.json();
      let modificationPlan;
      
      const aiResponse = result.choices[0].message.content;
      
      // Clean JSON extraction
      let cleanJson = aiResponse.trim();
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      const openBrace = cleanJson.indexOf('{');
      const closeBrace = cleanJson.lastIndexOf('}');
      
      if (openBrace !== -1 && closeBrace !== -1 && closeBrace > openBrace) {
        cleanJson = cleanJson.substring(openBrace, closeBrace + 1);
      }
      
      try {
        modificationPlan = JSON.parse(cleanJson);
        
        // Validate and ensure proper properties
        if (!modificationPlan.modifications || !Array.isArray(modificationPlan.modifications)) {
          throw new Error('Invalid modifications array');
        }
        
        modificationPlan.modifications.forEach((mod: any) => {
          // Ensure proper Azure service naming
          if (!mod.label || !mod.product) {
            mod.label = mod.label || 'New Service';
            mod.product = mod.product || mod.label || 'Azure Service';
          }
          
          // Fix Azure service naming to match existing pattern
          if (mod.product && !mod.product.toLowerCase().startsWith('azure') && !mod.product.toLowerCase().includes('microsoft')) {
            // Map common services to their Azure equivalents
            const azureServiceMap: Record<string, string> = {
              'power bi': 'Power BI',
              'powerbi': 'Power BI', 
              'redis': 'Azure Redis Cache',
              'cache': 'Azure Redis Cache',
              'storage': 'Azure Blob Storage',
              'blob storage': 'Azure Blob Storage',
              'sql database': 'Azure SQL Database',
              'database': 'Azure SQL Database',
              'application insights': 'Azure Application Insights',
              'insights': 'Azure Application Insights',
              'key vault': 'Azure Key Vault',
              'cosmos db': 'Azure Cosmos DB'
            };
            
            const normalizedProduct = mod.product.toLowerCase();
            const azureService = azureServiceMap[normalizedProduct];
            if (azureService) {
              mod.product = azureService;
            } else if (!normalizedProduct.includes('power bi')) {
              // Add Azure prefix for other services
              mod.product = `Azure ${mod.product}`;
            }
          }
        });
        
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`AI response parsing failed: ${errorMessage}`);
      }
      
      // Apply modifications to architecture
      let updatedNodes = [...architecture.nodes];
      let updatedEdges = [...architecture.edges];
      
      // Process node modifications
      modificationPlan.modifications?.forEach((mod: any) => {
        if (mod.action === 'add') {
          console.log('🔧 Creating new node:', {
            id: mod.nodeId,
            label: mod.label,
            product: mod.product,
            type: mod.type,
            hasConfig: !!mod.config
          });
          
          const newNode = {
            id: mod.nodeId || `node-${Date.now()}`,
            label: mod.label || 'New Service',
            product: mod.product || 'Azure Service',
            type: mod.type || 'service',
            config: mod.config || {
              tier: "Standard",
              region: "East US", 
              rationale: "Service added via AI modification",
              technicalDetails: "AI-generated service component",
              features: ["Standard features"],
              useCases: ["General purpose"],
              bestPractices: ["Follow Azure best practices"]
            }
          };
          
          console.log('✅ New node created:', newNode);
          updatedNodes.push(newNode);
        } else if (mod.action === 'remove') {
          updatedNodes = updatedNodes.filter(n => n.id !== mod.nodeId);
          updatedEdges = updatedEdges.filter(e => e.source !== mod.nodeId && e.target !== mod.nodeId);
        } else if (mod.action === 'modify') {
          const nodeIndex = updatedNodes.findIndex(n => n.id === mod.nodeId);
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              data: { 
                ...updatedNodes[nodeIndex].data, 
                label: mod.label || updatedNodes[nodeIndex].data.label,
                product: mod.product || updatedNodes[nodeIndex].data.product,
                type: mod.type || updatedNodes[nodeIndex].data.type
              }
            };
          }
        }
      });

      // Process new edges (intelligent connections)
      if (modificationPlan.newEdges) {
        modificationPlan.newEdges.forEach((edge: any) => {
          // Validate that both source and target nodes exist
          const sourceExists = updatedNodes.find(n => n.id === edge.source);
          const targetExists = updatedNodes.find(n => n.id === edge.target);
          
          if (!sourceExists) {
            console.warn(`⚠️ Edge source node "${edge.source}" does not exist. Skipping edge.`);
            return;
          }
          
          if (!targetExists) {
            console.warn(`⚠️ Edge target node "${edge.target}" does not exist. Skipping edge.`);
            return;
          }
          
          const newEdge = {
            id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: edge.source,
            target: edge.target,
            label: edge.label || '',
            type: edge.type || 'smoothstep',
            animated: edge.animated || false,
            style: edge.style || { stroke: '#6366f1', strokeWidth: 2 }
          };
          updatedEdges.push(newEdge);
        });
      }
      
      // FILTER OUT USER NODES - Force removal on frontend
      const originalNodeCount = updatedNodes.length;
      updatedNodes = updatedNodes.filter((node: any) => {
        const isUserNode = node.type === 'user' || 
                         (node.product && node.product.toLowerCase().includes('user')) ||
                         (node.label && (
                           node.label.toLowerCase().includes('user') || 
                           node.label.toLowerCase().includes('scientist') ||
                           node.label.toLowerCase().includes('developer') ||
                           node.label.toLowerCase().includes('admin')
                         ));
        
        if (isUserNode) {
          console.log(`🚫 REMOVING USER NODE: ${node.id} - ${node.label} (${node.product})`);
          return false;
        }
        return true;
      });
      
      if (originalNodeCount !== updatedNodes.length) {
        console.log(`✅ Filtered ${originalNodeCount - updatedNodes.length} user nodes from modification. Remaining: ${updatedNodes.length}`);
        
        // Also remove edges that referenced removed user nodes
        const nodeIds = new Set(updatedNodes.map((n: any) => n.id));
        const originalEdgeCount = updatedEdges.length;
        updatedEdges = updatedEdges.filter((edge: any) => 
          nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );
        if (originalEdgeCount !== updatedEdges.length) {
          console.log(`✅ Filtered ${originalEdgeCount - updatedEdges.length} orphaned edges from modification. Remaining: ${updatedEdges.length}`);
        }
      }
      
      // Update architecture
      const updatedArchitecture = {
        ...architecture,
        nodes: updatedNodes,
        edges: updatedEdges,
      };
      
      onArchitectureUpdate(updatedArchitecture);
      
      addAssistantMessage(`✓ ${modificationPlan.description}`);
      
      toast.success('Architecture Updated', {
        description: modificationPlan.description,
      });
      
    } catch (error) {
      console.error('Error editing architecture:', error);
      addAssistantMessage(`Sorry, I couldn't process that modification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle general questions
  const handleQuestion = async (userInput: string) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        addAssistantMessage("I'd be happy to help answer your question, but I need an API key configured to provide detailed responses.");
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert Azure cloud architect assistant. Answer questions about Azure services, cloud architecture, best practices, and related topics. Keep responses helpful, accurate, and concise.`
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content?.trim();
      
      if (answer) {
        addAssistantMessage(answer);
      } else {
        addAssistantMessage("I'm sorry, I couldn't generate a response to your question.");
      }
      
    } catch (error) {
      console.error('Error answering question:', error);
      addAssistantMessage(`I'm having trouble accessing my knowledge base right now. ${error instanceof Error ? error.message : 'Please try again later.'}`);
    }
  };

  // Handle component explanation
  const handleComponentExplanation = async (userInput: string) => {
    if (!architecture || !architecture.nodes || architecture.nodes.length === 0) {
      addAssistantMessage("I don't see any components in your current architecture to explain. Would you like me to create an architecture first?");
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        // Fallback to basic explanation
        const componentList = architecture.nodes.map((node: any) => `• ${node.label} (${node.product})`).join('\n');
        addAssistantMessage(`Here are the components in your current architecture:\n\n${componentList}\n\nFor detailed explanations, please configure an API key.`);
        return;
      }

      const componentsContext = architecture.nodes.map((node: any) => 
        `${node.label}: ${node.product}${node.config ? ` (${JSON.stringify(node.config)})` : ''}`
      ).join('\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are explaining Azure architecture components to a user. Here are the components in their current architecture:\n\n${componentsContext}\n\nProvide clear, helpful explanations about the components they're asking about.`
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get explanation: ${response.status}`);
      }

      const data = await response.json();
      const explanation = data.choices[0]?.message?.content?.trim();
      
      if (explanation) {
        addAssistantMessage(explanation);
      } else {
        addAssistantMessage("I'm sorry, I couldn't generate an explanation for that component.");
      }
      
    } catch (error) {
      console.error('Error explaining component:', error);
      addAssistantMessage(`I'm having trouble explaining that component right now. ${error instanceof Error ? error.message : 'Please try again later.'}`);
    }
  };

  // Handle general chat
  const handleGeneralChat = async (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      addAssistantMessage("Hello! I'm your Azure architecture assistant. I can help you design cloud architectures, answer questions about Azure services, or explain existing components. What would you like to work on?");
    } else if (lowerInput.includes('thank')) {
      addAssistantMessage("You're welcome! Is there anything else I can help you with regarding your Azure architecture?");
    } else if (lowerInput.includes('help')) {
      addAssistantMessage(`I can help you with:
      
• **Create Architecture**: Describe what you want to build (e.g., "Create a web app with database")
• **Ask Questions**: Ask about Azure services (e.g., "What is Azure Functions?")  
• **Explain Components**: Get details about your current architecture
• **Modify Architecture**: Request changes (e.g., "Add a Redis cache")

What would you like to do?`);
    } else {
      addAssistantMessage("I'm here to help with Azure architecture design. You can ask me to create architectures, answer questions about Azure services, or explain components. What would you like to work on?");
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.info('Help', { description: 'Documentation coming soon!' });
              }}
            >
              Help
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.info('Profile', { description: 'Profile settings coming soon!' });
              }}
            >
              Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable, takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6" ref={scrollRef}>
            <AnimatePresence>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">Try these examples:</p>
                  {exampleRequirements.map((example, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleExampleClick(example)}
                      disabled={isLoading}
                      className="w-full text-left p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    >
                      <p className="text-sm">{example}</p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'assistant' && (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Generating architecture...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed height */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
        {architecture && (
          <div className="flex justify-end mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Clear chat and architecture?')) {
                  setMessages([]);
                  onClear();
                  toast.success('Cleared', { description: 'Chat and architecture cleared' });
                }
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Describe your system architecture requirements..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] resize-none bg-white"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
