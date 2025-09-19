import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentModal } from '@/components/modals/ContentModal';
import { AddNodeModal } from '@/components/modals/AddNodeModal';
import { NodeCanvas } from '@/components/planning/NodeCanvas';
import { toast } from 'sonner';
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
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nodes, setNodes] = useState<ContentNode[]>([
    {
      id: '1',
      title: 'Product Launch Post',
      type: 'post',
      status: 'scheduled',
      scheduledDate: new Date('2024-01-15'),
      content: 'Exciting product launch announcement with key features and benefits.',
      connections: ['2', '3'],
      position: { x: 50, y: 50 },
    },
    {
      id: '2',
      title: 'Behind Scenes Story',
      type: 'story',
      status: 'draft',
      content: 'Show the team working on the product development process.',
      connections: ['3'],
      position: { x: 350, y: 120 },
    },
    {
      id: '3',
      title: 'Feature Highlight',
      type: 'image',
      status: 'draft',
      content: 'Detailed infographic showing product features and specifications.',
      connections: [],
      position: { x: 200, y: 250 },
    },
  ]);

  const handleNodeClick = (node: ContentNode) => {
    setSelectedNode(node);
    setShowModal(true);
  };

  const handleAddNode = (nodeData: Omit<ContentNode, 'id'>) => {
    const newNode: ContentNode = {
      ...nodeData,
      id: Date.now().toString(),
    };
    
    setNodes(prev => [...prev, newNode]);
    toast.success('New content node created successfully!');
  };

  const handleNodeMove = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => 
      prev.map(node => 
        node.id === nodeId ? { ...node, position } : node
      )
    );
  };

  const handleScheduleToCalendar = (node: ContentNode) => {
    if (!node.scheduledDate) {
      toast.error('Please set a schedule date for this node first');
      return;
    }
    
    toast.success(`${node.title} added to calendar for ${node.scheduledDate.toLocaleDateString()}`);
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
              <span className="text-xs text-muted-foreground">
                Published: {nodes.filter(n => n.status === 'published').length}
              </span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-xs text-muted-foreground">
                Scheduled: {nodes.filter(n => n.status === 'scheduled').length}
              </span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span className="text-xs text-muted-foreground">
                Drafts: {nodes.filter(n => n.status === 'draft').length}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Node Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <NodeCanvas 
          nodes={nodes} 
          onNodeClick={handleNodeClick}
          onNodeMove={handleNodeMove}
        />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border/20 bg-card/20 backdrop-blur-sm">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 border-primary/20 hover:border-primary/40">
            <Calendar className="w-3 h-3 mr-2" />
            Calendar View
          </Button>
          <Button variant="outline" size="sm" className="flex-1 border-primary/20 hover:border-primary/40">
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
        onScheduleToCalendar={handleScheduleToCalendar}
      />

      {/* Add Node Modal */}
      <AddNodeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddNode={handleAddNode}
        existingNodes={nodes}
      />
    </div>
  );
};