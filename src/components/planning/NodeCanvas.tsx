import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Eye, 
  Zap, 
  Calendar,
  ArrowRight,
  GripVertical 
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

interface NodeCanvasProps {
  nodes: ContentNode[];
  onNodeClick: (node: ContentNode) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ nodes, onNodeClick, onNodeMove }) => {
  const [dragging, setDragging] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: ContentNode['status']) => {
    switch (status) {
      case 'published': return 'bg-success text-success-foreground';
      case 'scheduled': return 'bg-gradient-primary text-white';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
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

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string, currentPosition: { x: number; y: number }) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offset = {
      x: e.clientX - rect.left - currentPosition.x,
      y: e.clientY - rect.top - currentPosition.y,
    };

    setDragging({ nodeId, offset });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: Math.max(0, Math.min(e.clientX - rect.left - dragging.offset.x, rect.width - 240)),
      y: Math.max(0, Math.min(e.clientY - rect.top - dragging.offset.y, rect.height - 200)),
    };

    onNodeMove(dragging.nodeId, newPosition);
  }, [dragging, onNodeMove]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full p-6 overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(191 19% 33%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(191 25% 40%)" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {nodes.map((node) => 
          node.connections.map((connectedId) => {
            const connectedNode = nodes.find(n => n.id === connectedId);
            if (!connectedNode) return null;
            
            return (
              <line
                key={`${node.id}-${connectedId}`}
                x1={node.position.x + 120}
                y1={node.position.y + 60}
                x2={connectedNode.position.x + 120}
                y2={connectedNode.position.y + 60}
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })
        )}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const TypeIcon = getTypeIcon(node.type);
        
        return (
          <Card
            key={node.id}
            className={`absolute w-60 bg-card/90 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-200 z-10 ${
              dragging?.nodeId === node.id ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-pointer hover:shadow-xl'
            }`}
            style={{
              left: node.position.x,
              top: node.position.y,
              transform: dragging?.nodeId === node.id ? 'rotate(2deg)' : 'rotate(0deg)',
            }}
          >
            {/* Drag Handle */}
            <div
              className="flex items-center justify-between p-2 border-b border-border/20 cursor-grab active:cursor-grabbing bg-gradient-primary/10"
              onMouseDown={(e) => handleMouseDown(e, node.id, node.position)}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Drag to move</span>
              </div>
              <Badge variant="secondary" className={`text-xs ${getStatusColor(node.status)}`}>
                {node.status}
              </Badge>
            </div>

            {/* Node Content */}
            <div 
              className="p-4 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <TypeIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{node.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {node.content}
              </p>

              <div className="flex items-center justify-between">
                {node.scheduledDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {node.scheduledDate.toLocaleDateString()}
                  </div>
                )}
              </div>

              {node.connections.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                    <span>Connects to {node.connections.length} item(s)</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* Add Node Helper */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 bg-card/50 rounded-xl border border-border/30 backdrop-blur-sm">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Content Nodes Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Add Node" to create your first content piece
            </p>
            <Button variant="outline" className="border-primary/20 hover:border-primary/40">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};