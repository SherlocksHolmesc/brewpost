import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Image, Type, Wand2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  contentType?: 'text' | 'image';
  imageUrl?: string;
  captions?: string[];
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content:
        'Welcome to BrewPost! 🎯 I can help you plan and create amazing content. Try asking me to "plan content structure" or "connect content pieces" to get strategic suggestions for your content flow!',
      timestamp: new Date(),
      contentType: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const quickPrompts = [
    { icon: Image, text: 'Plan content structure' },
    { icon: Type, text: 'Connect content pieces' },
    { icon: Wand2, text: 'Marketing campaign' },
  ];

  // keep your old local planner as fallback when backend isn't used
  const generatePlanningResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('plan') || lowerInput.includes('structure') || lowerInput.includes('organize')) {
      return `I can help you plan your content structure! Here are some suggestions:

**Content Flow Strategy:**
• Start with a main announcement post
• Follow with behind-the-scenes content
• Create supporting visual content
• End with user engagement posts

**Node Connections:**
• Link related content pieces
• Create content series with sequential flow
• Connect different formats (post → story → image)

Would you like me to suggest specific content nodes for your "${userInput}" campaign?`;
    }

    if (lowerInput.includes('connect') || lowerInput.includes('link')) {
      return `Great! I can help you connect your content nodes strategically:

**Connection Strategies:**
• Sequential: A → B → C (story progression)
• Hub: Main post connected to supporting content
• Campaign: All nodes linked for unified messaging

Click the link icon on any node to start connecting them. What type of content flow are you planning?`;
    }

    return `I'll help you create content based on: "${userInput}". I can also help you plan the structure and connections between your content pieces. Would you like me to suggest a content planning strategy?`;
  };

  // NEW: helper to append a message safely
  const appendMessage = (m: Message) => setMessages(prev => [...prev, m]);

  type GenerateResponse = { imageUrl: string; captions: string[]; text?: string };

  // later in the component: replace your existing handleSend with this
  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      contentType: 'text',
    };

    // optimistic append
    appendMessage(userMessage);

    // build messagesForBackend from current local state + the new message
    const MAX_TURNS = 6;
    const allTurns = [...messages, userMessage]; // include new message immediately
    const filteredTurns = allTurns
      .filter(m => !(m.type === 'ai' && m.id === '1')) // remove static UI welcome
      .filter(m => (m.type === 'user' || m.type === 'ai') && (!m.contentType || m.contentType === 'text'))
      .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
    const recent = filteredTurns.slice(Math.max(0, filteredTurns.length - MAX_TURNS));
    const messagesForBackend = recent;

    setInput('');
    setIsGenerating(true);

    try {
      const resp = await fetch('http://localhost:8081/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesForBackend }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Generate failed');
      }
      const data: GenerateResponse = await resp.json();

      if (data.text) {
        appendMessage({
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: data.text,
          timestamp: new Date(),
          contentType: 'text',
        });
      } else {
        appendMessage({
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: generatePlanningResponse(input),
          timestamp: new Date(),
          contentType: 'text',
        });
      }

      if (data.imageUrl) {
        appendMessage({
          id: (Date.now() + 3).toString(),
          type: 'ai',
          content: 'Image generated — choose a caption below or edit it.',
          timestamp: new Date(),
          contentType: 'image',
          imageUrl: data.imageUrl,
          captions: Array.isArray(data.captions) ? data.captions : [],
        });
      }
    } catch (err: any) {
      console.error(err);
      appendMessage({
        id: (Date.now() + 4).toString(),
        type: 'system',
        content: 'Sorry, something went wrong generating the reply. Check server logs.',
        timestamp: new Date(),
        contentType: 'text',
      });
    } finally {
      setIsGenerating(false);
    }
  };




  // Insert a caption into input (user can edit & send)
  const handleUseCaption = (caption: string) => setInput(caption);

  return (
    <div className="flex flex-col h-full bg-gradient-subtle">
      {/* Chat Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">AI Content Generator</h2>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="border-primary/20 hover:border-primary/40 glow-hover"
              onClick={() => setInput(prompt.text.toLowerCase())}
            >
              <prompt.icon className="w-4 h-4 mr-2" />
              {prompt.text}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.type === 'user' ? 'bg-gradient-primary text-white' : 'bg-card/50 backdrop-blur-sm border-border/50'
              }`}
            >
              {message.contentType === 'image' && message.imageUrl ? (
                <div>
                  <img src={message.imageUrl} alt="generated" className="w-full max-h-96 object-contain rounded-md mb-3" />
                  <p className="text-sm leading-relaxed mb-2">{message.content}</p>

                  {/* caption suggestions */}
                  {message.captions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {message.captions.map((c, i) => (
                        <button
                          key={i}
                          className="px-3 py-1 rounded-full bg-gray-800 text-sm text-white hover:opacity-90"
                          onClick={() => handleUseCaption(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs opacity-60">No captions suggested.</div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </>
              )}

              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs opacity-70">
                  {message.type === 'ai' ? 'AI' : message.type === 'user' ? 'You' : 'System'}
                </Badge>
                <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
              </div>
            </Card>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm text-muted-foreground ml-2">Generating content...</span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-border/20">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the content you want to create..."
            className="min-h-[60px] resize-none glow-focus border-primary/20 focus:border-primary/40"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isGenerating} className="bg-gradient-primary hover:opacity-90 glow-hover px-6">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
