import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Send, Sparkles, User, Bot, Trash2, HelpCircle, UserCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

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
      
      // Check if this is an edit request (and architecture exists)
      const editKeywords = ['replace', 'change', 'swap', 'remove', 'delete', 'add', 'connect', 'modify', 'update'];
      const isEditRequest = architecture && editKeywords.some(keyword => userInput.toLowerCase().includes(keyword));
      
      if (isEditRequest) {
        // Handle as edit
        try {
          console.log('Detected edit request:', userInput);
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f62db522/api/edit-architecture`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                architectureId: architecture.id,
                editRequest: userInput,
                currentNodes: architecture.nodes,
                currentEdges: architecture.edges,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to edit architecture');
          }

          const data = await response.json();
          
          // Update architecture
          onArchitectureUpdate({
            ...architecture,
            nodes: data.nodes,
            edges: data.edges,
          });
          
          // Add assistant response
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'assistant',
            content: `✓ ${data.description}`,
            timestamp: new Date(),
          }]);
          
          toast.success('Architecture Updated', {
            description: data.description,
          });
          
        } catch (error) {
          console.error('Error editing architecture:', error);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'assistant',
            content: `Sorry, I couldn't process that edit: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          }]);
        }
      } else {
        // Handle as new generation
        onGenerate(userInput);
      }
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
