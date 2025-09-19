import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ContentNode {
  id: string;
  title: string;
  type: 'post' | 'image' | 'story';
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: Date;
  content: string;
  imageUrl?: string;
  connections: string[];
  position: { x: number; y: number };
}

export const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const nodes = location.state?.nodes as ContentNode[] || [];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-6 border-b border-border/20 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/app')}
            className="border-primary/20 hover:border-primary/40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Planning
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Content Calendar</h1>
            <p className="text-sm text-muted-foreground">
              {nodes.length} content items scheduled
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <CalendarView 
          scheduledNodes={nodes}
          onClose={() => navigate('/app')} 
        />
      </div>
    </div>
  );
};