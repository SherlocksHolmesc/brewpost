import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AIChat } from '@/components/ai/AIChat';
import { NodeDetails } from '@/components/ai/NodeDetails';
import { PlanningPanel, type PlanningPanelRef } from '@/components/planning/PlanningPanel';
import { CircleCanvas } from '@/components/canvas/CircleCanvas';
import { ComponentSidebar } from '@/components/canvas/ComponentSidebar';
import { TemplatePopup } from '@/components/template/TemplatePopup';
import { Sparkles, Calendar, Network, LogOut, FileText, X } from 'lucide-react';
import type { ContentNode } from '@/components/planning/PlanningPanel';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [nodes, setNodes] = useState<ContentNode[]>([]);
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [viewMode, setViewMode] = useState<'nodes' | 'canvas'>('nodes'); // New state for view mode
  const [canvasNodeId, setCanvasNodeId] = useState<string | null>(null); // Store node ID for canvas mode
  const [selectedCanvasComponents, setSelectedCanvasComponents] = useState<any[]>([]); // State for canvas components
  const [isGenerating, setIsGenerating] = useState<boolean | string>(false); // State for generation status
  const [isTemplatePopupOpen, setIsTemplatePopupOpen] = useState(false);
  const planningPanelRef = useRef<PlanningPanelRef>(null);

  // Shared save function that works in both modes
  const handleSaveNode = (updatedNode: ContentNode) => {
    console.log('=== MAIN LAYOUT HANDLE SAVE NODE DEBUG ===');
    console.log('MainLayout handleSaveNode called with:', updatedNode);
    console.log('Current viewMode:', viewMode);
    console.log('Updated node scheduledDate:', updatedNode.scheduledDate);
    console.log('Updated node scheduledDate ISO:', updatedNode.scheduledDate?.toISOString());
    
    if (viewMode === 'nodes' && planningPanelRef.current?.handleSaveNode) {
      // Use PlanningPanel's save function in nodes mode
      console.log('Using PlanningPanel handleSaveNode');
      planningPanelRef.current.handleSaveNode(updatedNode);
    } else {
      // Direct save in canvas mode
      console.log('Using direct save in canvas mode');
      console.log('Canvas mode: handleSaveNode called with:', updatedNode);
      
      // Update nodes state immediately - use debugSetNodes to sync with PlanningPanel
      debugSetNodes(prevNodes => {
        const updated = prevNodes.map(node => 
          node.id === updatedNode.id ? updatedNode : node
        );
        console.log('Canvas mode: Updated nodes state with new scheduledDate:', updated.find(n => n.id === updatedNode.id)?.scheduledDate);
        return updated;
      });
      
      // Also update selectedNode directly if it's the same node
      if (selectedNode && selectedNode.id === updatedNode.id) {
        console.log('Canvas mode: Updating selectedNode directly:', updatedNode);
        setSelectedNode(updatedNode);
      }
      
      // Import and call NodeAPI directly
      import('@/services/nodeService').then(({ NodeAPI }) => {
        const updateData = {
          projectId: 'demo-project-123',
          nodeId: updatedNode.id,
          title: updatedNode.title,
          description: updatedNode.content,
          status: updatedNode.status,
          type: updatedNode.type,
          day: updatedNode.day,
          imageUrl: updatedNode.imageUrl,
          imageUrls: updatedNode.imageUrls,
          imagePrompt: updatedNode.imagePrompt,
          scheduledDate: updatedNode.scheduledDate ? updatedNode.scheduledDate.toISOString() : null,
        };
        console.log('Canvas mode: Sending update to NodeAPI:', updateData);
        
        NodeAPI.update(updateData)
          .then(() => console.log('Canvas mode: Node updated successfully'))
          .catch(error => console.error('Canvas mode: Failed to update node:', error));
      });
    }
    console.log('=== END MAIN LAYOUT HANDLE SAVE NODE DEBUG ===');
  };

  // Shared post function that works in both modes
  const handlePostNode = (node: ContentNode) => {
    if (viewMode === 'nodes' && planningPanelRef.current?.handlePostNode) {
      planningPanelRef.current.handlePostNode(node);
    } else {
      // Handle posting in canvas mode
      const updatedNode = {
        ...node,
        // Do not force publish when invoked for scheduling; preserve existing status
        status: node.status,
        postedAt: node.postedAt,
        postedTo: node.postedTo
      };
      handleSaveNode(updatedNode);
    }
  };
  // Load nodes from AppSync only - no localStorage fallback
  useEffect(() => {
    const loadNodes = async () => {
      try {
        const { NodeAPI } = await import('@/services/nodeService');
        const apiNodes = await NodeAPI.list('demo-project-123');
        const detectPostType = (title: string, content: string): 'engaging' | 'promotional' | 'branding' => {
          const text = `${title} ${content}`.toLowerCase();
          if (text.match(/\b(shop|order|buy|get yours|discount|available now|limited|offer|sale|use code|sign up|join|link in bio|free shipping|diy|recipe|create|make|try|get|start)\b/)) {
            return 'promotional';
          }
          if (text.match(/\b(crafted|behind the scenes|heritage|tradition|quality|meet|farmer|team|values|trust|story of|our process|secret|day in the life|art of|history|unveiling|science|grading|special)\b/)) {
            return 'branding';
          }
          return 'engaging';
        };
        
        const transformedNodes = apiNodes.map(x => ({
          id: x.nodeId,
          title: x.title,
          type: (x.type as any) ?? 'post',
          status: (x.status as any) ?? 'draft',
          scheduledDate: x.scheduledDate ? new Date(x.scheduledDate) : undefined,
          content: x.description ?? '',
          imageUrl: x.imageUrl ?? undefined,
          imageUrls: x.imageUrls ?? undefined,
          imagePrompt: x.imagePrompt ?? undefined,
          day: x.day ?? undefined,
          postType: detectPostType(x.title, x.description ?? ''),
          connections: [],
          position: { x: x.x ?? 0, y: x.y ?? 0 },
          postedAt: x.createdAt ? new Date(x.createdAt) : undefined
        }));
        
        // Load edges and populate connections
        try {
          const { NodeAPI: EdgeAPI } = await import('@/services/nodeService');
          const edges = await EdgeAPI.listEdges('demo-project-123');
          console.log('Loaded edges:', edges.length);
          
          // Add connections to nodes based on edges
          const nodesWithConnections = transformedNodes.map(node => ({
            ...node,
            connections: edges.filter(edge => edge.from === node.id).map(edge => edge.to)
          }));
          
          setNodes(nodesWithConnections);
        } catch (edgeError) {
          console.warn('Failed to load edges:', edgeError);
          setNodes(transformedNodes);
        }
      } catch (error) {
        console.warn('Failed to load from AppSync, starting with empty nodes:', error);
        setNodes([]);
      }
    };
    loadNodes();
  }, []);





  // Wrap setNodes to add debug logging when nodes change
  const debugSetNodes = (next: ContentNode[] | ((prev: ContentNode[]) => ContentNode[])) => {
    if (typeof next === 'function') {
      setNodes(prev => {
        const updated = (next as (p: ContentNode[]) => ContentNode[])(prev);
        console.info('MainLayout: nodes updated (from function) ->', updated.length);
        // Update selected node if it exists, or clear if it no longer exists
        if (selectedNode) {
          const updatedSelectedNode = updated.find(n => n.id === selectedNode.id);
          if (updatedSelectedNode) {
            console.log('Updating selectedNode with new data:', updatedSelectedNode);
            setSelectedNode(updatedSelectedNode);
          } else {
            setSelectedNode(null);
            setActiveTab('ai');
          }
        }
        return updated;
      });
    } else {
      console.info('MainLayout: nodes replaced ->', next.length);
      // Update selected node if it exists, or clear if it no longer exists
      if (selectedNode) {
        const updatedSelectedNode = next.find(n => n.id === selectedNode.id);
        if (updatedSelectedNode) {
          console.log('MainLayout: Updating selectedNode with new data:', updatedSelectedNode);
          setSelectedNode(updatedSelectedNode);
        } else {
          setSelectedNode(null);
          setActiveTab('ai');
        }
      }
      setNodes(next);
    }
  };

  const handleNodeSelect = (node: ContentNode) => {
    setSelectedNode(node);
    setActiveTab('details');
    setViewMode('nodes'); // Switch to nodes view when a node is selected
    setCanvasNodeId(null); // Clear canvas node ID when switching to nodes view
  };

  const handleNodeDoubleClick = (node: ContentNode) => {
    setSelectedNode(node);
    setActiveTab('details');
    setViewMode('canvas'); // Switch to canvas view on double-click
    setCanvasNodeId(node.id); // Store node ID for future reference if needed
    
    // If node has image prompt, automatically start generation
    if (node.imagePrompt || node.title || node.content) {
      console.log('Node double-clicked with prompt data, preparing for image generation');
      // Clear any existing canvas components and set up for node-based generation
      setSelectedCanvasComponents([]);
      setIsGenerating(false);
    }
  };

  const handleCanvasClick = () => {
    // Remove canvas switching on background click
    // Canvas mode only accessible via node selection or manual toggle
  };

  const handleCalendarPage = () => {
    navigate('/calendar');
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl relative z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="BrewPost" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BrewPost
              </h1>
              <p className="text-xs text-muted-foreground">AI Content Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle Button */}
            <div className="flex items-center bg-card border border-border/30 rounded-lg p-1 glow-hover">
              <button
                onClick={() => {
                  setViewMode('nodes');
                  if (canvasNodeId) {
                    setCanvasNodeId(null); // Clear canvas node when switching to nodes mode
                  }
                }}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'nodes'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nodes
              </button>
              <button
                onClick={() => {
                  setViewMode('canvas');
                  setCanvasNodeId(null); // Clear canvas node ID when manually switching
                }}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'canvas'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Canvas
              </button>
            </div>
            

            <Button 
              size="sm" 
              className="bg-gradient-primary hover:opacity-90 glow-hover"
              onClick={() => setIsTemplatePopupOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-primary hover:opacity-90 glow-hover"
              onClick={handleCalendarPage}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10 text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Left Sidebar with Tabs - Main Area (always 30% width) */}
        <div className="w-[30%] transition-all duration-500 ease-in-out opacity-100">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-border/20 px-6 pt-4 pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai" className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4" />
                  AI Generator
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  {selectedNode ? (selectedNode.title.length > 12 ? selectedNode.title.slice(0, 12) + '...' : selectedNode.title) : 'Details'}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeTab === 'ai' && (
                <div className="h-full">
                  <AIChat setPlanningNodes={debugSetNodes} />
                </div>
              )}
              {activeTab === 'details' && (
                <div className="h-full">
                  <NodeDetails 
                    node={selectedNode}
                    nodes={nodes}
                    onSaveNode={handleSaveNode}
                    onPostNode={handlePostNode}
                  />
                </div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Right Side - Planning Panel in nodes mode, empty in canvas mode */}
        <div className="w-[70%] h-[calc(100vh-80px)] transition-all duration-500 ease-in-out">
          {viewMode === 'nodes' ? (
            <div className="h-full bg-card border-l border-border/50 backdrop-blur-xl">
              <PlanningPanel 
                nodes={nodes} 
                setNodes={debugSetNodes} 
                onNodeSelect={handleNodeSelect}
                onNodeDoubleClick={handleNodeDoubleClick}
                onCanvasClick={handleCanvasClick}
                ref={planningPanelRef}
              />
            </div>
          ) : (
            <div className="h-full bg-gradient-subtle relative">
              <CircleCanvas 
                selectedComponents={selectedCanvasComponents}
                isGenerating={isGenerating}
                selectedNode={selectedNode}
                onSaveNode={handleSaveNode}
                onGenerate={(status) => {
                  console.log('Generate status:', status);
                  setIsGenerating(status);
                }}
                onAddComponent={(component) => {
                  const newComponent = {
                    id: component.id,
                    name: component.name,
                    category: component.category,
                    color: component.color,
                    position: { x: 0, y: 0 }
                  };
                  setSelectedCanvasComponents(prev => {
                    if (prev.find(c => c.id === component.id)) {
                      return prev; // Don't add duplicates
                    }
                    return [...prev, newComponent];
                  });
                }}
                onRemoveComponent={(id) => {
                  setSelectedCanvasComponents(prev => prev.filter(c => c.id !== id));
                }}
                generatedComponents={[
                  // Local Data Components
                  {
                    id: "demo-1",
                    type: "local_data",
                    title: "Local Coffee Trends",
                    description: "Trending coffee preferences in your area",
                    data: {},
                    relevanceScore: 85,
                    category: "Local Data",
                    keywords: ["coffee", "local", "trends"],
                    impact: "high"
                  },
                  {
                    id: "demo-4",
                    type: "local_data",
                    title: "Regional Demographics",
                    description: "Local customer demographics and behavior patterns",
                    data: {},
                    relevanceScore: 79,
                    category: "Local Data",
                    keywords: ["demographics", "local", "customers"],
                    impact: "medium"
                  },
                  {
                    id: "demo-5",
                    type: "local_data",
                    title: "Competitor Analysis",
                    description: "Local competitor pricing and offerings",
                    data: {},
                    relevanceScore: 73,
                    category: "Local Data",
                    keywords: ["competitors", "pricing", "local"],
                    impact: "medium"
                  },
                  {
                    id: "demo-6",
                    type: "local_data",
                    title: "Weather Impact",
                    description: "How local weather affects customer behavior",
                    data: {},
                    relevanceScore: 68,
                    category: "Local Data",
                    keywords: ["weather", "behavior", "seasonal"],
                    impact: "low"
                  },
                  {
                    id: "demo-7",
                    type: "local_data",
                    title: "Peak Hours Analysis",
                    description: "Busiest times and customer flow patterns",
                    data: {},
                    relevanceScore: 88,
                    category: "Local Data",
                    keywords: ["peak", "hours", "traffic"],
                    impact: "high"
                  },

                  // Online Trend Data Components
                  {
                    id: "demo-2", 
                    type: "online_trend",
                    title: "Social Media Buzz",
                    description: "Latest social media trends and engagement",
                    data: {},
                    relevanceScore: 92,
                    category: "Online trend data",
                    keywords: ["social", "engagement", "viral"],
                    impact: "high"
                  },
                  {
                    id: "demo-8",
                    type: "online_trend",
                    title: "Hashtag Performance",
                    description: "Trending hashtags in your industry",
                    data: {},
                    relevanceScore: 84,
                    category: "Online trend data",
                    keywords: ["hashtags", "trending", "social"],
                    impact: "high"
                  },
                  {
                    id: "demo-9",
                    type: "online_trend",
                    title: "Viral Content Types",
                    description: "Most shared content formats this week",
                    data: {},
                    relevanceScore: 76,
                    category: "Online trend data",
                    keywords: ["viral", "content", "formats"],
                    impact: "medium"
                  },
                  {
                    id: "demo-10",
                    type: "online_trend",
                    title: "Influencer Mentions",
                    description: "Key influencers talking about your niche",
                    data: {},
                    relevanceScore: 81,
                    category: "Online trend data",
                    keywords: ["influencers", "mentions", "niche"],
                    impact: "high"
                  },
                  {
                    id: "demo-11",
                    type: "online_trend",
                    title: "Search Trends",
                    description: "Rising search queries related to your business",
                    data: {},
                    relevanceScore: 87,
                    category: "Online trend data",
                    keywords: ["search", "queries", "trending"],
                    impact: "high"
                  },
                  {
                    id: "demo-12",
                    type: "online_trend",
                    title: "Platform Analytics",
                    description: "Cross-platform engagement metrics",
                    data: {},
                    relevanceScore: 72,
                    category: "Online trend data",
                    keywords: ["analytics", "platforms", "engagement"],
                    impact: "medium"
                  },

                  // Campaign Type Components
                  {
                    id: "demo-3",
                    type: "campaign_type",
                    title: "Seasonal Campaign",
                    description: "Autumn-themed promotional campaign",
                    data: {},
                    relevanceScore: 78,
                    category: "Campaign Type", 
                    keywords: ["autumn", "seasonal", "promotion"],
                    impact: "medium"
                  },
                  {
                    id: "demo-13",
                    type: "campaign_type",
                    title: "Flash Sale Event",
                    description: "Limited-time promotional offers",
                    data: {},
                    relevanceScore: 89,
                    category: "Campaign Type",
                    keywords: ["flash", "sale", "limited"],
                    impact: "high"
                  },
                  {
                    id: "demo-14",
                    type: "campaign_type",
                    title: "Brand Awareness",
                    description: "Build recognition and recall campaigns",
                    data: {},
                    relevanceScore: 75,
                    category: "Campaign Type",
                    keywords: ["brand", "awareness", "recognition"],
                    impact: "medium"
                  },
                  {
                    id: "demo-15",
                    type: "campaign_type",
                    title: "Customer Loyalty",
                    description: "Reward and retain existing customers",
                    data: {},
                    relevanceScore: 82,
                    category: "Campaign Type",
                    keywords: ["loyalty", "retention", "rewards"],
                    impact: "high"
                  },
                  {
                    id: "demo-16",
                    type: "campaign_type",
                    title: "Product Launch",
                    description: "Introduce new products or services",
                    data: {},
                    relevanceScore: 91,
                    category: "Campaign Type",
                    keywords: ["launch", "new", "product"],
                    impact: "high"
                  },
                  {
                    id: "demo-17",
                    type: "campaign_type",
                    title: "Holiday Special",
                    description: "Holiday-themed promotional content",
                    data: {},
                    relevanceScore: 86,
                    category: "Campaign Type",
                    keywords: ["holiday", "special", "themed"],
                    impact: "high"
                  },
                  {
                    id: "demo-18",
                    type: "campaign_type",
                    title: "User Generated Content",
                    description: "Encourage customers to create content",
                    data: {},
                    relevanceScore: 77,
                    category: "Campaign Type",
                    keywords: ["ugc", "user", "generated"],
                    impact: "medium"
                  }
                ]}
              />
              
              {/* ComponentSidebar positioned at bottom */}
              <div className="absolute bottom-0 left-0 right-0">
                <ComponentSidebar 
                  onAddComponent={(component) => {
                    const newComponent = {
                      id: component.id,
                      name: component.name,
                      category: component.category,
                      color: component.color,
                      position: { x: 0, y: 0 }
                    };
                    setSelectedCanvasComponents(prev => {
                      if (prev.find(c => c.id === component.id)) {
                        return prev; // Don't add duplicates
                      }
                      return [...prev, newComponent];
                    });
                  }}
                  onRemoveFromCanvas={(id) => {
                    setSelectedCanvasComponents(prev => prev.filter(c => c.id !== id));
                  }}
                  generatedComponents={[
                    // Same demo components as CircleCanvas for consistency
                    {
                      id: "demo-1",
                      type: "local_data",
                      title: "Local Coffee Trends",
                      description: "Trending coffee preferences in your area",
                      data: {},
                      relevanceScore: 85,
                      category: "Local Data",
                      keywords: ["coffee", "local", "trends"],
                      impact: "high"
                    },
                    {
                      id: "demo-4",
                      type: "local_data",
                      title: "Regional Demographics", 
                      description: "Local customer demographics and behavior patterns",
                      data: {},
                      relevanceScore: 79,
                      category: "Local Data",
                      keywords: ["demographics", "local", "customers"],
                      impact: "medium"
                    },
                    {
                      id: "demo-5",
                      type: "local_data",
                      title: "Competitor Analysis",
                      description: "Local competitor pricing and offerings",
                      data: {},
                      relevanceScore: 73,
                      category: "Local Data",
                      keywords: ["competitors", "pricing", "local"],
                      impact: "medium"
                    },
                    {
                      id: "demo-6",
                      type: "local_data",
                      title: "Weather Impact",
                      description: "How local weather affects customer behavior",
                      data: {},
                      relevanceScore: 68,
                      category: "Local Data",
                      keywords: ["weather", "behavior", "seasonal"],
                      impact: "low"
                    },
                    {
                      id: "demo-7",
                      type: "local_data",
                      title: "Peak Hours Analysis",
                      description: "Busiest times and customer flow patterns",
                      data: {},
                      relevanceScore: 88,
                      category: "Local Data",
                      keywords: ["peak", "hours", "traffic"],
                      impact: "high"
                    },
                    {
                      id: "demo-2", 
                      type: "online_trend",
                      title: "Social Media Buzz",
                      description: "Latest social media trends and engagement",
                      data: {},
                      relevanceScore: 92,
                      category: "Online trend data",
                      keywords: ["social", "engagement", "viral"],
                      impact: "high"
                    },
                    {
                      id: "demo-8",
                      type: "online_trend",
                      title: "Hashtag Performance",
                      description: "Trending hashtags in your industry",
                      data: {},
                      relevanceScore: 84,
                      category: "Online trend data",
                      keywords: ["hashtags", "trending", "social"],
                      impact: "high"
                    },
                    {
                      id: "demo-9",
                      type: "online_trend", 
                      title: "Viral Content Types",
                      description: "Most shared content formats this week",
                      data: {},
                      relevanceScore: 76,
                      category: "Online trend data",
                      keywords: ["viral", "content", "formats"],
                      impact: "medium"
                    },
                    {
                      id: "demo-10",
                      type: "online_trend",
                      title: "Influencer Mentions",
                      description: "Key influencers talking about your niche", 
                      data: {},
                      relevanceScore: 81,
                      category: "Online trend data",
                      keywords: ["influencers", "mentions", "niche"],
                      impact: "high"
                    },
                    {
                      id: "demo-11",
                      type: "online_trend",
                      title: "Search Trends",
                      description: "Rising search queries related to your business",
                      data: {},
                      relevanceScore: 87,
                      category: "Online trend data",
                      keywords: ["search", "queries", "trending"],
                      impact: "high"
                    },
                    {
                      id: "demo-12",
                      type: "online_trend",
                      title: "Platform Analytics",
                      description: "Cross-platform engagement metrics",
                      data: {},
                      relevanceScore: 72,
                      category: "Online trend data", 
                      keywords: ["analytics", "platforms", "engagement"],
                      impact: "medium"
                    },
                    {
                      id: "demo-3",
                      type: "campaign_type",
                      title: "Seasonal Campaign",
                      description: "Autumn-themed promotional campaign",
                      data: {},
                      relevanceScore: 78,
                      category: "Campaign Type",
                      keywords: ["autumn", "seasonal", "promotion"],
                      impact: "medium"
                    },
                    {
                      id: "demo-13",
                      type: "campaign_type",
                      title: "Flash Sale Event",
                      description: "Limited-time promotional offers",
                      data: {},
                      relevanceScore: 89,
                      category: "Campaign Type",
                      keywords: ["flash", "sale", "limited"],
                      impact: "high"
                    },
                    {
                      id: "demo-14", 
                      type: "campaign_type",
                      title: "Brand Awareness",
                      description: "Build recognition and recall campaigns",
                      data: {},
                      relevanceScore: 75,
                      category: "Campaign Type",
                      keywords: ["brand", "awareness", "recognition"],
                      impact: "medium"
                    },
                    {
                      id: "demo-15",
                      type: "campaign_type",
                      title: "Customer Loyalty",
                      description: "Reward and retain existing customers",
                      data: {},
                      relevanceScore: 82,
                      category: "Campaign Type",
                      keywords: ["loyalty", "retention", "rewards"],
                      impact: "high"
                    },
                    {
                      id: "demo-16",
                      type: "campaign_type",
                      title: "Product Launch",
                      description: "Introduce new products or services",
                      data: {},
                      relevanceScore: 91,
                      category: "Campaign Type",
                      keywords: ["launch", "new", "product"],
                      impact: "high"
                    },
                    {
                      id: "demo-17",
                      type: "campaign_type",
                      title: "Holiday Special",
                      description: "Holiday-themed promotional content",
                      data: {},
                      relevanceScore: 86,
                      category: "Campaign Type",
                      keywords: ["holiday", "special", "themed"],
                      impact: "high"
                    },
                    {
                      id: "demo-18",
                      type: "campaign_type",
                      title: "User Generated Content",
                      description: "Encourage customers to create content",
                      data: {},
                      relevanceScore: 77,
                      category: "Campaign Type",
                      keywords: ["ugc", "user", "generated"],
                      impact: "medium"
                    }
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Popup */}
      <TemplatePopup 
        isOpen={isTemplatePopupOpen}
        onClose={() => setIsTemplatePopupOpen(false)}
      />
    </div>
  );
};
