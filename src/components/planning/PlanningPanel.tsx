import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentModal } from '@/components/modals/ContentModal';
import { DraggableNodeCanvas } from '@/components/planning/DraggableNodeCanvas';
import { AddNodeModal } from '@/components/modals/AddNodeModal';
import { ScheduleConfirmationModal } from '@/components/modals/ScheduleConfirmationModal';
import { CalendarModal } from '@/components/modals/CalendarModal';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Plus, 
  ArrowRight,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

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

export const PlanningPanel: React.FC = () => {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleConfirmation, setShowScheduleConfirmation] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [nodes, setNodes] = useState<ContentNode[]>([
    {
      id: '1',
      title: 'Product Launch Post',
      type: 'post',
      status: 'scheduled',
      scheduledDate: new Date('2024-01-15'),
      content: 'Exciting product launch announcement with key features and benefits.',
      connections: ['2', '3'],
      position: { x: 50, y: 50 }
    },
    {
      id: '2',
      title: 'Behind Scenes Story',
      type: 'story',
      status: 'draft',
      content: 'Show the team working on the product development process.',
      connections: ['3'],
      position: { x: 350, y: 120 }
    },
    {
      id: '3',
      title: 'Feature Highlight',
      type: 'image',
      status: 'draft',
      content: 'Detailed infographic showing product features and specifications.',
      connections: [],
      position: { x: 200, y: 250 }
    },
  ]);

  const handleNodeClick = (node: ContentNode) => {
    setSelectedNode(node);
    setShowModal(true);
  };

  const handleNodeUpdate = (updatedNodes: ContentNode[]) => {
    setNodes(updatedNodes);
  };

  const handleAddNode = (nodeData: Omit<ContentNode, 'id' | 'connections'>) => {
    const newNode: ContentNode = {
      ...nodeData,
      id: Date.now().toString(),
      connections: []
    };
    setNodes([...nodes, newNode]);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter(node => node.id !== nodeId)
      .map(node => ({
        ...node,
        connections: node.connections.filter(id => id !== nodeId)
      }));
    setNodes(updatedNodes);
  };

  const handleScheduleAll = () => {
    setShowScheduleConfirmation(true);
  };

  const handleConfirmSchedule = () => {
    // Automatically schedule all nodes with dates starting from today
    const today = new Date();
    const updatedNodes = nodes.map((node, index) => {
      // Calculate date for each node (spread them across days)
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + index);
      
      return {
        ...node,
        status: 'scheduled' as const,
        scheduledDate: scheduledDate
      };
    });
    
    setNodes(updatedNodes);
    setShowScheduleConfirmation(false);
    // Redirect to the dedicated calendar page
    navigate('/calendar', { state: { nodes: updatedNodes } });
  };

  const handleCalendarView = () => {
    setShowCalendarModal(true);
  };

  const getStatusColor = (status: ContentNode['status']) => {
    switch (status) {
      case 'published': return 'bg-success';
      case 'scheduled': return 'bg-gradient-primary';
      case 'draft': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getTypeIcon = (type: ContentNode['type']) => {
    switch (type) {
      case 'post': return Target;
      case 'image': return Eye;
      case 'story': return Zap;
      default: return Target;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-subtle">
      {/* Planning Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Content Planning
            </h2>
            <p className="text-sm text-muted-foreground">
              Connect and schedule your content flow
            </p>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-secondary hover:opacity-90 glow-hover"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Node
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-muted-foreground">Published: 12</span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-xs text-muted-foreground">Scheduled: 5</span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span className="text-xs text-muted-foreground">Drafts: 8</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Node Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <DraggableNodeCanvas 
          nodes={nodes} 
          onNodeClick={handleNodeClick}
          onNodeUpdate={handleNodeUpdate}
          onAddNode={() => setShowAddModal(true)}
          onDeleteNode={handleDeleteNode}
        />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border/20 bg-card/20 backdrop-blur-sm">
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             className="flex-1 border-primary/20 hover:border-primary/40"
             onClick={handleCalendarView}
           >
            <Calendar className="w-3 h-3 mr-2" />
            Calendar View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-primary/20 hover:border-primary/40"
            onClick={handleScheduleAll}
          >
            <Clock className="w-3 h-3 mr-2" />
            Schedule All
          </Button>
        </div>
      </div>

      {/* Content Modal */}
      <ContentModal
        node={selectedNode}
        open={showModal}
        onOpenChange={setShowModal}
      />

      {/* Add Node Modal */}
      <AddNodeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddNode={handleAddNode}
      />

      {/* Schedule Confirmation Modal */}
      <ScheduleConfirmationModal
        open={showScheduleConfirmation}
        onOpenChange={setShowScheduleConfirmation}
        nodes={nodes}
        onConfirm={handleConfirmSchedule}
      />

      {/* Calendar Preview Modal */}
      <CalendarModal
        open={showCalendarModal}
        onOpenChange={setShowCalendarModal}
        scheduledNodes={nodes.filter(node => node.scheduledDate && node.status === 'scheduled')}
      />
    </div>
  );
};