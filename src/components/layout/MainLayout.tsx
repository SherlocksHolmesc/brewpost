import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AIChat } from '@/components/ai/AIChat';
import { PlanningPanel } from '@/components/planning/PlanningPanel';
import { Sparkles, Calendar, Network, LogOut } from 'lucide-react';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showPlanning, setShowPlanning] = useState(true); // Default to open
  const [showCalendar, setShowCalendar] = useState(false);

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
        {/* AI Chat - Main Area (30% when planning is open) */}
        <div className={`transition-all duration-500 ease-in-out ${
          showPlanning ? 'w-[30%]' : 'w-full'
        }`}>
          <AIChat />
        </div>

        {/* Planning Panel - Sliding Sidebar (70% when open) */}
        <div className={`fixed right-0 top-[80px] h-[calc(100vh-80px)] bg-card border-l border-border/50 backdrop-blur-xl transition-all duration-500 ease-in-out z-40 ${
          showPlanning 
            ? 'w-[70%] translate-x-0 opacity-100' 
            : 'w-[70%] translate-x-full opacity-0 pointer-events-none'
        }`}>
          <PlanningPanel />
        </div>
      </div>

    </div>
  );
};