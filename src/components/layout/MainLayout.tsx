import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AIChat } from '@/components/ai/AIChat';
import { PlanningPanel } from '@/components/planning/PlanningPanel';
import { Sparkles, Calendar, Network } from 'lucide-react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [showPlanning, setShowPlanning] = useState(false);

  const togglePlanning = () => {
    setShowPlanning(!showPlanning);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl relative z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BrewPost
              </h1>
              <p className="text-xs text-muted-foreground">AI Content Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlanning}
              className="border-primary/20 hover:border-primary/40 glow-hover"
            >
              <Network className="w-4 h-4 mr-2" />
              {showPlanning ? 'Hide Planning' : 'Show Planning'}
            </Button>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90 glow-hover">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* AI Chat - Main Area */}
        <div className={`transition-all duration-500 ease-in-out ${
          showPlanning ? 'w-1/2' : 'w-full'
        }`}>
          <AIChat />
        </div>

        {/* Planning Panel - Sliding Sidebar */}
        <div className={`fixed right-0 top-[80px] h-[calc(100vh-80px)] bg-card border-l border-border/50 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 ${
          showPlanning 
            ? 'w-1/2 translate-x-0 opacity-100' 
            : 'w-1/2 translate-x-full opacity-0 pointer-events-none'
        }`}>
          <PlanningPanel />
        </div>
      </div>
    </div>
  );
};