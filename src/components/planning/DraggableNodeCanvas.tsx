import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Eye, 
  Zap, 
  Calendar,
  ArrowRight,
  Plus,
  Link,
  X
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
  onNodeUpdate: (nodes: ContentNode[]) => void;
  onAddNode: () => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const DraggableNodeCanvas: React.FC<NodeCanvasProps> = ({ 
  nodes, 
  onNodeClick, 
  onNodeUpdate,
  onAddNode,
  onDeleteNode 
}) => {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingMode, setConnectingMode] = useState<string | null>(null);
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

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return; // Only handle left click
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    const rect = (e.target as HTMLElement).closest('.node-card')?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [nodes]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - canvasRect.left - dragOffset.x;
    const newY = e.clientY - canvasRect.top - dragOffset.y;

    const updatedNodes = nodes.map(node => 
      node.id === draggedNode 
        ? { ...node, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
        : node
    );

    onNodeUpdate(updatedNodes);
  }, [draggedNode, dragOffset, nodes, onNodeUpdate]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    if (draggedNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNode, handleMouseMove, handleMouseUp]);

  const handleConnect = (fromNodeId: string, toNodeId: string) => {
    if (fromNodeId === toNodeId) return;

    const updatedNodes = nodes.map(node => {
      if (node.id === fromNodeId) {
        const connections = node.connections.includes(toNodeId) 
          ? node.connections.filter(id => id !== toNodeId)
          : [...node.connections, toNodeId];
        return { ...node, connections };
      }
      return node;
    });

    onNodeUpdate(updatedNodes);
    setConnectingMode(null);
  };

  const removeConnection = (fromNodeId: string, toNodeId: string) => {
    const updatedNodes = nodes.map(node => 
      node.id === fromNodeId 
        ? { ...node, connections: node.connections.filter(id => id !== toNodeId) }
        : node
    );
    onNodeUpdate(updatedNodes);
  };

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full p-6 overflow-auto bg-gradient-to-br from-background/50 to-background/80"
      style={{ cursor: draggedNode ? 'grabbing' : 'default' }}
    >
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {nodes.map(node => 
          node.connections.map(connectedId => {
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
                className="transition-all duration-300"
              />
            );
          })
        )}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const TypeIcon = getTypeIcon(node.type);
        const isConnecting = connectingMode === node.id;
        const canConnect = connectingMode && connectingMode !== node.id;
        
        return (
          <Card
            key={node.id}
            className={`node-card absolute w-60 p-4 bg-card/90 backdrop-blur-sm border-border/50 transition-all duration-200 z-10 ${
              draggedNode === node.id 
                ? 'scale-105 shadow-2xl border-primary/50 cursor-grabbing' 
                : 'hover:border-primary/50 cursor-grab hover:scale-102'
            } ${
              isConnecting 
                ? 'ring-2 ring-primary/50 border-primary' 
                : ''
            } ${
              canConnect 
                ? 'ring-2 ring-accent/50 border-accent cursor-pointer' 
                : ''
            }`}
            style={{
              left: node.position.x,
              top: node.position.y,
            }}
            onMouseDown={(e) => {
              if (!canConnect) {
                handleMouseDown(e, node.id);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (canConnect) {
                handleConnect(connectingMode, node.id);
              } else if (!draggedNode) {
                onNodeClick(node);
              }
            }}
          >
            {/* Connection Controls */}
            <div className="absolute -top-2 -right-2 flex gap-1">
              {onDeleteNode && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-destructive hover:bg-destructive/90 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNode(node.id);
                  }}
                  title="Delete node"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {connectingMode === node.id ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-destructive hover:bg-destructive/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConnectingMode(null);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-accent hover:bg-accent/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConnectingMode(node.id);
                  }}
                >
                  <Link className="w-3 h-3" />
                </Button>
              )}
            </div>

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
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(node.status)}`}
              >
                {node.status}
              </Badge>
              
              {node.scheduledDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {node.scheduledDate.toLocaleDateString()}
                </div>
              )}
            </div>

            {node.connections.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                    <span>{node.connections.length} connection(s)</span>
                  </div>
                  <div className="flex gap-1">
                    {node.connections.map(connId => (
                      <Button
                        key={connId}
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeConnection(node.id, connId);
                        }}
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Floating Add Button */}
      <div className="absolute bottom-6 right-6">
        <Button 
          onClick={onAddNode}
          className="w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform glow-hover p-0"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Connection Mode Instructions */}
      {connectingMode && (
        <div className="absolute top-6 left-6 bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-4 z-20">
          <p className="text-sm text-muted-foreground mb-2">
            Click another node to connect, or click the X to cancel
          </p>
          <p className="text-xs text-muted-foreground">
            Connecting from: <span className="font-medium">
              {nodes.find(n => n.id === connectingMode)?.title}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};