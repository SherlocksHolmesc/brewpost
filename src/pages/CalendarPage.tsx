import React, { useState, useEffect } from 'react';
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
  const [nodes, setNodes] = useState(location.state?.nodes || []);

  useEffect(() => {
    if (location.state?.nodes) {
      setNodes(location.state.nodes);
    }
  }, [location.state?.nodes]);

  const handleUpdateNode = (updatedNode: any) => {
    const updatedNodes = nodes.map((node: any) => 
      node.id === updatedNode.id ? updatedNode : node
    );
    setNodes(updatedNodes);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((node: any) => node.id !== nodeId);
    setNodes(updatedNodes);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/app')}
          className="mb-4 border-primary/20 hover:border-primary/40"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Planning
        </Button>
        <CalendarView 
          scheduledNodes={nodes} 
          onClose={() => navigate('/app')}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
        />
      </div>
    </div>
  );
};