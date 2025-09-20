import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Image, Type, Wand2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  contentType?: 'text' | 'image';
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Welcome to BrewPost! 🎯 I can help you plan and create amazing content. Try asking me to "plan content structure" or "connect content pieces" to get strategic suggestions for your content flow!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsGenerating(true);

    // Enhanced AI response with planning capabilities
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generatePlanningResponse(currentInput),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 1500);
  };

  const quickPrompts = [
    { icon: Image, text: 'Plan content structure', color: 'bg-gradient-primary' },
    { icon: Type, text: 'Connect content pieces', color: 'bg-gradient-secondary' },
    { icon: Wand2, text: 'Marketing campaign', color: 'bg-gradient-accent' },
  ];

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
            <Card className={`max-w-[80%] p-4 ${
              message.type === 'user' 
                ? 'bg-gradient-primary text-white' 
                : 'bg-card/50 backdrop-blur-sm border-border/50'
            }`}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs opacity-70">
                  {message.type === 'ai' ? 'AI' : 'You'}
                </Badge>
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
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
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="bg-gradient-primary hover:opacity-90 glow-hover px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};