import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Image, Type, Wand2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ContentNode } from '@/components/planning/PlanningPanel';

const cleanField = (s?: string) =>
  (s ?? '')
    .replace(/^\s*(\*{1,}|[-•])\s*/,'')   // **** or * or bullet at start
    .replace(/^\s*["'`]+|["'`]+$/g,'')    // trim surrounding quotes
    .replace(/\s+/g,' ')
    .trim();

interface Message {
  id: string;
  title?: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  contentType?: 'text' | 'image';
  imageUrl?: string;
  imagePrompt?: string;
  captions?: string[];
}

type PlannerNode = {
  day: string;
  title: string;
  caption: string;
  imagePrompt: string;
};

export function extractPlannerNodesFromText(raw: string): PlannerNode[] {
  const text = raw.replace(/\r\n/g, '\n');
  const dayNamesRe = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i;

  // Split into blocks by markdown heading lines (e.g., #### ...)
  const headingRe = /^#{2,6}\s*(.+)$/gm;
  const blocks: { heading: string; content: string }[] = [];

  let lastIndex = 0;
  let lastHeading = '';
  let m: RegExpExecArray | null;

  // Walk through headings and capture content between them
  while ((m = headingRe.exec(text)) !== null) {
    const heading = m[1].trim();
    const start = m.index + m[0].length;
    if (lastHeading) {
      const content = text.slice(lastIndex, m.index).trim();
      blocks.push({ heading: lastHeading, content });
    }
    lastHeading = heading;
    lastIndex = start;
  }

  // push final block
  if (lastHeading) {
    const content = text.slice(lastIndex).trim();
    blocks.push({ heading: lastHeading, content });
  }

  const nodes: PlannerNode[] = [];

  blocks.forEach((b, idx) => {
    // Extract day from heading (e.g., 'Monday: The Rise of DeFi' or '**Monday: ...')
    const heading = b.heading.replace(/\*+/g, '').trim();
    const dayMatch = heading.match(dayNamesRe);
    const day = dayMatch ? dayMatch[0] : '';

  // If heading contains a title after the day (e.g., 'Monday: The Rise...'), use it as title fallback
  const headingTitle = heading.replace(dayNamesRe, '').replace(/^[:\s-]+/, '').trim();

    const content = b.content;
    const titleInlineRe = /(?:\*\*Title\*\*|Title)\s*[:-]?/i;
    const captionInlineRe = /(?:\*\*Caption\*\*|Caption)\s*[:-]?/i;
    const imagePromptInlineRe = /(?:\*\*Image Prompt\*\*|Image Prompt)\b[:-]?\s*/i;

    let titleFound: string | undefined = undefined;
    let captionFound = '';
    let imagePromptFound = '';

    const titleRe = /(?:\*\*Title\*\*|Title)\s*[:-]\s*(?:"([^"]+)"|'([^']+)'|([^\n]+))/i;
    const titleMatch = content.match(titleRe);
    if (titleMatch) {
      titleFound = (titleMatch[1] || titleMatch[2] || titleMatch[3] || '').trim();
    }

    // Find positions for caption and image prompt markers
    const captionPos = content.search(captionInlineRe);
    const imagePromptPos = content.search(imagePromptInlineRe);

    if (captionPos >= 0) {
      const capMarkerMatch = content.slice(captionPos).match(/(?:\*\*Caption\*\*|Caption)\s*[:-]?\s*/i);
      const capStart = captionPos + (capMarkerMatch ? capMarkerMatch[0].length : 0);
      const capEnd = imagePromptPos >= 0 ? imagePromptPos : content.length;
      captionFound = content.slice(capStart, capEnd).trim();
    }

    if (imagePromptPos >= 0) {
      const ipMarkerMatch = content.slice(imagePromptPos).match(/(?:\*\*Image Prompt\*\*|Image Prompt)\b[:-]?\s*/i);
      const ipStart = imagePromptPos + (ipMarkerMatch ? ipMarkerMatch[0].length : 0);
      const rest = content.slice(ipStart).trim();
      const doubleNl = rest.search(/\n\s*\n/);
      imagePromptFound = doubleNl >= 0 ? rest.slice(0, doubleNl).trim() : rest.trim();
    }

    const title = (titleFound && titleFound.length > 0) ? titleFound : headingTitle || `Untitled ${idx + 1}`;

    // Normalize title and image prompt
    let cleanTitle = title.replace(/\*+/g, '').trim();
    cleanTitle = cleanTitle.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();

    let cleanImagePrompt = (imagePromptFound || '').replace(/\s+/g, ' ').trim();
    cleanImagePrompt = cleanImagePrompt.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();

    const caption = captionFound.replace(/^[-\s]*/,'').trim();

    // Only accept blocks that explicitly reference a weekday in the heading
    // This prevents the top-level header like 'PLANNER MODE: 7-Day Weekly Content Plan' from becoming a node
    if (day) {
      nodes.push({
        day,
        title: cleanTitle,
        caption,
        imagePrompt: cleanImagePrompt,
      });
    } else {
      console.debug('AIChat: skipping non-day block heading:', heading.slice(0, 80));
    }
  });

  // As a final fallback, if no heading blocks found, try to parse by looking for bullet sections with 'Title' markers
  if (nodes.length === 0) {
    const itemRe = /(?:[-*]\s*)?\*\*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\*\*?[:\s]*([\s\S]*?)(?=(?:\n[-*\s]*\*\*?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\*\*?)|$)/gi;
    let it: RegExpExecArray | null;
    while ((it = itemRe.exec(text)) !== null) {
      const day = it[1];
      const block = it[2] || '';

      const titleRe = /(?:\*\*Title\*\*|Title)\s*[:-]?\s*(?:"([^"]+)"|'([^']+)'|([^\n]+))/i;
      const titleMatch = block.match(titleRe);
      const captionPos = block.search(/(?:\*\*Caption\*\*|Caption)\s*[:-]?/i);
      const imagePromptPos = block.search(/(?:\*\*Image Prompt\*\*|Image Prompt)\b[:\-]?\s*/i);

      const titleFound = titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3] || '').trim() : '';
      const capStart = captionPos >= 0 ? (captionPos + (block.slice(captionPos).match(/(?:\*\*Caption\*\*|Caption)\s*[:-]?\s*/i)?.[0].length || 0)) : -1;
      const capEnd = imagePromptPos >= 0 ? imagePromptPos : block.length;
      const captionFound = capStart >= 0 ? block.slice(capStart, capEnd).trim() : '';

      let imagePromptFound = '';
      if (imagePromptPos >= 0) {
        const ipStart = imagePromptPos + (block.slice(imagePromptPos).match(/(?:\*\*Image Prompt\*\*|Image Prompt)\b[:-]?\s*/i)?.[0].length || 0);
        const rest = block.slice(ipStart).trim();
        const doubleNl = rest.search(/\n\s*\n/);
        imagePromptFound = doubleNl >= 0 ? rest.slice(0, doubleNl).trim() : rest.trim();
      }

      const titleFinal = (titleFound || '').replace(/\*+/g, '').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim() || 'Untitled';
      const imagePromptFinal = imagePromptFound.replace(/\s+/g, ' ').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').trim();

      nodes.push({ day, title: titleFinal, caption: captionFound, imagePrompt: imagePromptFinal });
    }
  }
  console.info('AIChat: parsed planner blocks ->', nodes.map(n => ({ day: n.day, title: n.title, hasImagePrompt: !!n.imagePrompt })));
  return nodes;
}

function mapPlannerNodesToContentNodes(plannerNodes: PlannerNode[]): ContentNode[] {
  const ids = plannerNodes.map((_, i) => Date.now().toString() + '-' + i + '-' + Math.floor(Math.random() * 1000));
  const count = plannerNodes.length;
  const spacing = 320; // increased horizontal spacing between nodes
  const startX = 40; // left padding
  const topY = 60; // top row Y
  const bottomY = topY + 220; // bottom row Y (zig-zag)

    return plannerNodes.map((node, index) => {
      const isBottom = index % 2 === 1;
      const x = startX + index * (spacing / 2);
      const y = isBottom ? bottomY : topY;

      let cleanedCaption = (node.caption || '').trim();
      const ipIdx = cleanedCaption.search(/(?:\*\*Image Prompt\*\*|Image Prompt)\b[:-]?/i);
      if (ipIdx >= 0) {
        cleanedCaption = cleanedCaption.slice(0, ipIdx).trim();
      }
      cleanedCaption = cleanedCaption.replace(/^\*+\s*/, '').trim();

      let titleCandidate = (node.title || '').replace(/\*+/g, '').trim();
      if (!titleCandidate) {
        const firstLine = (cleanedCaption.split(/\r?\n/).find(l => l.trim()) || '').trim();
        titleCandidate = firstLine || `${node.day} Post`;
      }

      return {
        id: ids[index],
        title: titleCandidate,
        type: 'post',
        status: 'draft',
        scheduledDate: getNextWeekdayDate(index),
        content: cleanedCaption,
        imagePrompt: node.imagePrompt || undefined,
        day: node.day,
        connections: index < count - 1 ? [ids[index + 1]] : [],
        imageUrl: undefined,
        position: {
          x,
          y,
        },
      };
    });
}



function getNextWeekdayDate(offset: number): Date {
  const today = new Date();
  const newDate = new Date(today);
  newDate.setDate(today.getDate() + offset);
  return newDate;
}


interface AIChatProps {
  // optional: the AIChat can be rendered in places that don't need to update the planner
  setPlanningNodes?: (nodes: ContentNode[]) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ setPlanningNodes }) => {
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
  const navigate = useNavigate();

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
        const textForPlanner = data.text ?? generatePlanningResponse(input);
        const maybePlanner = extractPlannerNodesFromText(textForPlanner);
        appendMessage({
          id: (Date.now() + 1).toString(),
          title: maybePlanner[0]?.title,
          type: 'ai',
          content: data.text,
          timestamp: new Date(),
          contentType: 'text',
          imagePrompt: maybePlanner[0]?.imagePrompt,
        });
      } else {
        const textForPlanner = data.text ?? generatePlanningResponse(input);
        const maybePlanner = extractPlannerNodesFromText(textForPlanner);
        appendMessage({
          id: (Date.now() + 2).toString(),
          title: maybePlanner[0]?.title,
          type: 'ai',
          content: generatePlanningResponse(input),
          timestamp: new Date(),
          contentType: 'text',
          imagePrompt: maybePlanner[0]?.imagePrompt,
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
    } catch (err: unknown) {
      console.error('AIChat generate error', err);
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


  const isPlannerMessage = (text: string) => {
    // normalize and remove markdown emphasis
    const normalized = text.toLowerCase().replace(/\*+/g, '');

    const hasPlannerHeader = /#{2,6}\s*planner\s*mode\b.*:/i.test(normalized);

    const weekdays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const daysFound = weekdays.filter(day => normalized.includes(day)).length;

    return hasPlannerHeader && daysFound >= 4;
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
                  {message.type === 'ai' && message.contentType === 'text' && isPlannerMessage(message.content) && (
                    <Button
                      size="sm"
                      className="mt-4 bg-gradient-secondary glow-hover"
                      onClick={() => {
                        console.info('AIChat: Use This Planner clicked. message length:', message.content.length);
                        // log a short preview of the message to help debugging
                        console.debug('AIChat: message content preview:', message.content.slice(0, 1200));

                        const planner = extractPlannerNodesFromText(message.content);
                        console.info('AIChat: extractPlannerNodesFromText ->', planner.length, 'blocks');
                        console.debug('AIChat: planner parsed details:', planner);

                        const contentNodes = mapPlannerNodesToContentNodes(planner);
                        console.info('AIChat: contentNodes (before apply) ->', contentNodes.map(n => ({ id: n.id, title: n.title, hasImagePrompt: !!n.imagePrompt, imagePrompt: n.imagePrompt }))); 
                        // If extraction produced no nodes, create a single fallback node using the full message
                        if (contentNodes.length === 0) {
                          console.warn('AIChat: planner extraction returned 0 nodes, creating a fallback node');
                          const fallback: ContentNode[] = [{
                            id: Date.now().toString() + '-fallback',
                            title: 'AI Planner Suggestion',
                            type: 'post',
                            status: 'draft',
                            scheduledDate: new Date(),
                            content: message.content.slice(0, 800),
                            connections: [],
                            imageUrl: undefined,
                            position: { x: 60, y: 60 }
                          }];
                          contentNodes.push(...fallback);
                        }
                        // If a setter was provided by the parent (MainLayout) update it.
                        if (typeof setPlanningNodes === 'function') {
                          console.info('AIChat: applying planner nodes', contentNodes.length);
                          setPlanningNodes(contentNodes);
                          console.info('AIChat: applied planner nodes -> parent setter called');
                        } else {
                          // Defensive: don't throw if the prop wasn't provided (some modals render AIChat without it)
                          console.warn('AIChat: setPlanningNodes not provided, skipping applying planner nodes');
                        }
                      }}
                    >
                      📅 Use This Planner
                    </Button>
                  )}
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
