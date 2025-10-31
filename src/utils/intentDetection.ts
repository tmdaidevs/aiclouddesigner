// Intent Detection for Chat Messages
export enum ChatIntent {
  GENERATE_ARCHITECTURE = 'generate_architecture',
  ASK_QUESTION = 'ask_question', 
  EXPLAIN_COMPONENT = 'explain_component',
  MODIFY_ARCHITECTURE = 'modify_architecture',
  GENERAL_CHAT = 'general_chat'
}

export interface IntentResult {
  intent: ChatIntent;
  confidence: number;
  explanation?: string;
}

// Keyword patterns for fallback detection
const INTENT_PATTERNS = {
  [ChatIntent.GENERATE_ARCHITECTURE]: [
    'create', 'build', 'design', 'develop', 'make', 'set up', 'setup',
    'i need', 'i want', 'build me', 'create me', 'design me',
    'architecture', 'system', 'application', 'platform', 'solution',
    'web app', 'api', 'database', 'serverless', 'microservice'
  ],
  [ChatIntent.ASK_QUESTION]: [
    'what is', 'what are', 'how does', 'how do', 'explain', 'tell me about',
    'what', 'how', 'why', 'when', 'where', 'which', 'who',
    '?', 'question', 'help me understand', 'can you explain'
  ],
  [ChatIntent.EXPLAIN_COMPONENT]: [
    'this component', 'this service', 'this resource', 'the storage', 'the database',
    'the api', 'the function', 'explain this', 'what does this do',
    'how does this work', 'tell me about this', 'describe this'
  ],
  [ChatIntent.MODIFY_ARCHITECTURE]: [
    'add', 'remove', 'delete', 'change', 'modify', 'update', 'replace',
    'swap', 'connect', 'disconnect', 'edit', 'alter', 'adjust',
    'include', 'exclude', 'integrate', 'remove this', 'add a'
  ],
  [ChatIntent.GENERAL_CHAT]: [
    'hello', 'hi', 'hey', 'thanks', 'thank you', 'good', 'great',
    'awesome', 'perfect', 'nice', 'cool', 'ok', 'okay'
  ]
};

/**
 * Detects user intent using OpenAI API
 */
export async function detectIntentWithAI(
  message: string, 
  hasArchitecture: boolean,
  apiKey: string
): Promise<IntentResult> {
  try {
    const systemPrompt = `You are an intent classifier for an Azure architecture design tool. 

    Classify user messages into these intents:
    - GENERATE_ARCHITECTURE: User wants to create/design a new architecture
    - ASK_QUESTION: User asks about Azure services, cloud concepts, or general questions  
    - EXPLAIN_COMPONENT: User wants explanation about specific components in their current architecture
    - MODIFY_ARCHITECTURE: User wants to modify/edit their existing architecture
    - GENERAL_CHAT: General conversation, greetings, or casual chat

    Context: User ${hasArchitecture ? 'HAS an existing architecture' : 'has NO architecture yet'}

    Rules:
    - If no architecture exists, EXPLAIN_COMPONENT and MODIFY_ARCHITECTURE are unlikely
    - Questions starting with "what", "how", "why" are usually ASK_QUESTION
    - Requests to "add", "remove", "change" existing components are MODIFY_ARCHITECTURE
    - Requests to "create", "build", "design" new systems are GENERATE_ARCHITECTURE

    Respond with JSON: {"intent": "INTENT_NAME", "confidence": 0.0-1.0, "explanation": "brief reason"}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Faster and cheaper for intent classification
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: message
          }
        ],
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    const result = JSON.parse(content);
    
    // Normalize and validate intent
    let normalizedIntent = result.intent;
    
    // Handle case variations
    if (typeof normalizedIntent === 'string') {
      normalizedIntent = normalizedIntent.toLowerCase().replace(/[\s-]/g, '_');
    }
    
    // Map common variations
    const intentMapping: Record<string, ChatIntent> = {
      'generate_architecture': ChatIntent.GENERATE_ARCHITECTURE,
      'ask_question': ChatIntent.ASK_QUESTION,
      'explain_component': ChatIntent.EXPLAIN_COMPONENT,
      'modify_architecture': ChatIntent.MODIFY_ARCHITECTURE,
      'general_chat': ChatIntent.GENERAL_CHAT,
      // Alternative formats
      'GENERATE_ARCHITECTURE': ChatIntent.GENERATE_ARCHITECTURE,
      'ASK_QUESTION': ChatIntent.ASK_QUESTION,
      'EXPLAIN_COMPONENT': ChatIntent.EXPLAIN_COMPONENT,
      'MODIFY_ARCHITECTURE': ChatIntent.MODIFY_ARCHITECTURE,
      'GENERAL_CHAT': ChatIntent.GENERAL_CHAT
    };
    
    const finalIntent = intentMapping[normalizedIntent] || intentMapping[result.intent];
    
    if (!finalIntent) {
      throw new Error(`Invalid intent: ${result.intent} (normalized: ${normalizedIntent})`);
    }

    return {
      intent: finalIntent,
      confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      explanation: result.explanation
    };

  } catch (error) {
    console.warn('AI intent detection failed, falling back to pattern matching:', error);
    return detectIntentWithPatterns(message, hasArchitecture);
  }
}

/**
 * Fallback pattern-based intent detection
 */
export function detectIntentWithPatterns(
  message: string, 
  hasArchitecture: boolean
): IntentResult {
  const lowerMessage = message.toLowerCase();
  
  // Score each intent based on keyword matches
  const scores: Record<ChatIntent, number> = {
    [ChatIntent.GENERATE_ARCHITECTURE]: 0,
    [ChatIntent.ASK_QUESTION]: 0,
    [ChatIntent.EXPLAIN_COMPONENT]: 0,
    [ChatIntent.MODIFY_ARCHITECTURE]: 0,
    [ChatIntent.GENERAL_CHAT]: 0,
  };

  // Calculate scores for each intent
  Object.entries(INTENT_PATTERNS).forEach(([intent, patterns]) => {
    patterns.forEach(pattern => {
      if (lowerMessage.includes(pattern)) {
        scores[intent as ChatIntent] += 1;
      }
    });
  });

  // Apply context-based adjustments
  if (!hasArchitecture) {
    scores[ChatIntent.EXPLAIN_COMPONENT] *= 0.1; // Very unlikely without architecture
    scores[ChatIntent.MODIFY_ARCHITECTURE] *= 0.1; // Very unlikely without architecture
  }

  // Boost question intent for question marks
  if (lowerMessage.includes('?')) {
    scores[ChatIntent.ASK_QUESTION] += 2;
  }

  // Find the intent with highest score
  const maxScore = Math.max(...Object.values(scores));
  const bestIntent = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as ChatIntent;

  // Default fallback
  const finalIntent = bestIntent || (hasArchitecture ? ChatIntent.ASK_QUESTION : ChatIntent.GENERATE_ARCHITECTURE);
  
  return {
    intent: finalIntent,
    confidence: maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3, // Normalize confidence
    explanation: `Pattern-based detection (score: ${maxScore})`
  };
}

/**
 * Main intent detection function with fallback
 */
export async function detectIntent(
  message: string,
  hasArchitecture: boolean,
  apiKey?: string
): Promise<IntentResult> {
  if (apiKey) {
    return await detectIntentWithAI(message, hasArchitecture, apiKey);
  } else {
    return detectIntentWithPatterns(message, hasArchitecture);
  }
}