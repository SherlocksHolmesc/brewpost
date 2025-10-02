import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AIChat } from '@/components/ai/AIChat';
import { NodeDetails } from '@/components/ai/NodeDetails';
import { PlanningPanel, type PlanningPanelRef } from '@/components/planning/PlanningPanel';
import { Sparkles, Calendar, Network, LogOut, FileText } from 'lucide-react';
import type { ContentNode } from '@/components/planning/PlanningPanel';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showPlanning, setShowPlanning] = useState(true); // Default to open
  const [showCalendar, setShowCalendar] = useState(false);
  const [nodes, setNodes] = useState<ContentNode[]>([]);
  const [activeTab, setActiveTab] = useState('ai');
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const planningPanelRef = useRef<PlanningPanelRef>(null);
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
          setSelectedNode(updatedSelectedNode);
        } else {
          setSelectedNode(null);
          setActiveTab('ai');
        }
      }
      setNodes(next);
    }
  };

  const togglePlanning = () => {
    setShowPlanning(!showPlanning);
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
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlanning}
              className="border-primary/20 hover:border-primary/40 glow-hover"
            >
              <Network className="w-4 h-4 mr-2" />
              {showPlanning ? 'Hide Planning' : 'Show Planning'}
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
        {/* Left Sidebar with Tabs - Main Area (30% when planning is open) */}
        <div className={`transition-all duration-500 ease-in-out ${
          showPlanning ? 'w-[30%]' : 'w-full'
        }`}>
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
                    onSaveNode={(node) => {
                      if (planningPanelRef.current?.handleSaveNode) {
                        planningPanelRef.current.handleSaveNode(node);
                      }
                    }}
                    onPostNode={(node) => {
                      if (planningPanelRef.current?.handlePostNode) {
                        planningPanelRef.current.handlePostNode(node);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Planning Panel - Sliding Sidebar (70% when open) */}
        <div className={`fixed right-0 top-[80px] h-[calc(100vh-80px)] bg-card border-l border-border/50 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 ${
          showPlanning 
            ? 'w-[70%] translate-x-0 opacity-100' 
            : 'w-[70%] translate-x-full opacity-0 pointer-events-none'
        }`}>
          <PlanningPanel 
            nodes={nodes} 
            setNodes={setNodes} 
            onNodeSelect={(node) => {
              setSelectedNode(node);
              setActiveTab('details');
            }}
            ref={planningPanelRef}
          />
        </div>
      </div>

    </div>
  );
};