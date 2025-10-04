import React, { useState, useRef, useCallback, memo } from 'react';
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
  X,
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface ContentNode {
  id: string;
  title: string;
  type: 'post' | 'image' | 'story';
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: Date;
  content: string;
  imageUrl?: string;
  imagePrompt?: string;
  day?: string;
  connections: string[];
  position: { x: number; y: number };
  postedAt?: Date;
  postedTo?: string[];
  tweetId?: string;
}

interface NodeCanvasProps {
  nodes: ContentNode[];
  onNodeClick: (node: ContentNode) => void;
  onNodeDoubleClick?: (node: ContentNode) => void;
  onNodeUpdate: (nodes: ContentNode[]) => void;
  onAddNode: () => void;
  onDeleteNode?: (nodeId: string) => void;
  onEditNode?: (node: ContentNode) => void;
  createOrDeleteEdge?: (from: string, to: string) => Promise<void>;
  onCanvasClick?: () => void;
}

export const DraggableNodeCanvas: React.FC<NodeCanvasProps> = ({ 
  nodes, 
  onNodeClick, 
  onNodeDoubleClick,
  onNodeUpdate,
  onAddNode,
  onDeleteNode,
  onEditNode,
  createOrDeleteEdge,
  onCanvasClick 
}) => {
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingMode, setConnectingMode] = useState<string | null>(null);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPosition, setDraggedPosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const [helpDragging, setHelpDragging] = useState(false);
  const [helpOffset, setHelpOffset] = useState({ x: 0, y: 0 });
  const [helpPos, setHelpPos] = useState<{ x: number; y: number } | null>(null);
  const [helpVisible, setHelpVisible] = useState(true);

  const helpRef = useRef<HTMLDivElement>(null);
  const dragThreshold = 5; // Minimum distance before starting drag

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
    
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = (e.target as HTMLElement).closest('.node-card')?.getBoundingClientRect();
    if (rect) {
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      setDragOffset({ x: offsetX, y: offsetY });
      
      // Store initial mouse position for threshold checking
      const initialMousePos = { x: e.clientX, y: e.clientY };
      
      const handleInitialMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - initialMousePos.x;
        const deltaY = moveEvent.clientY - initialMousePos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > dragThreshold) {
          // Start actual dragging
          setDraggedNode(nodeId);
          setIsDragging(true);
          setDraggedPosition({ x: node.position.x, y: node.position.y });
          
          // Add smooth dragging class to body
          document.body.classList.add('dragging');
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
          
          // Remove initial move listener
          document.removeEventListener('mousemove', handleInitialMove);
          document.removeEventListener('mouseup', handleInitialUp);
        }
      };
      
      const handleInitialUp = () => {
        document.removeEventListener('mousemove', handleInitialMove);
        document.removeEventListener('mouseup', handleInitialUp);
      };
      
      // Listen for initial movement to determine if this is a drag
      document.addEventListener('mousemove', handleInitialMove, { passive: true });
      document.addEventListener('mouseup', handleInitialUp, { passive: true });
    }
  }, [nodes, dragThreshold]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedNode || !canvasRef.current || !isDragging) return;

    // Use requestAnimationFrame for optimal performance with smooth interpolation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate new position with smooth boundaries
      const newX = Math.max(0, Math.min(
        canvasRect.width - 240, // Account for node width
        e.clientX - canvasRect.left - dragOffset.x
      ));
      const newY = Math.max(0, Math.min(
        canvasRect.height - 200, // Account for node height
        e.clientY - canvasRect.top - dragOffset.y
      ));

      // Smooth interpolation for fluid movement
      const lerpFactor = 0.3; // Adjust for more/less smoothness
      const currentPos = draggedPosition;
      const smoothX = currentPos.x + (newX - currentPos.x) * lerpFactor;
      const smoothY = currentPos.y + (newY - currentPos.y) * lerpFactor;

      setDraggedPosition({ x: smoothX, y: smoothY });

      // Throttle updates to avoid overwhelming the parent component
      const now = performance.now();
      if (now - lastUpdateTime.current > 16) { // ~60fps
        const updatedNodes = nodes.map(node => 
          node.id === draggedNode 
            ? { ...node, position: { x: smoothX, y: smoothY } }
            : node
        );

        onNodeUpdate(updatedNodes);
        lastUpdateTime.current = now;
      }
    });
  }, [draggedNode, dragOffset, nodes, onNodeUpdate, isDragging, draggedPosition]);

  const handleMouseUp = useCallback(() => {
    // Clean up animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Final update with exact position
    if (draggedNode && isDragging) {
      const updatedNodes = nodes.map(node => 
        node.id === draggedNode 
          ? { ...node, position: draggedPosition }
          : node
      );
      onNodeUpdate(updatedNodes);
    }
    
    setDraggedNode(null);
    setIsDragging(false);
    setDraggedPosition({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    
    // Remove dragging styles from body with smooth transition
    document.body.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, [draggedNode, isDragging, draggedPosition, nodes, onNodeUpdate]);

  React.useEffect(() => {
    if (isDragging && draggedNode) {
      // Use passive listeners for better performance
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      
      // Prevent context menu during drag
      const preventContext = (e: Event) => e.preventDefault();
      document.addEventListener('contextmenu', preventContext);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('contextmenu', preventContext);
        
        // Cleanup: remove dragging styles if component unmounts during drag
        document.body.classList.remove('dragging');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Cleanup animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isDragging, draggedNode, handleMouseMove, handleMouseUp]);

  // Cleanup effect to remove dragging class on component unmount
  React.useEffect(() => {
    return () => {
      document.body.classList.remove('dragging');
      // Clear any pending click timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const handleConnect = useCallback((fromNodeId: string, toNodeId: string) => {
    if (fromNodeId === toNodeId) return;

    if (createOrDeleteEdge) {
      // Use API-based edge management
      createOrDeleteEdge(fromNodeId, toNodeId);
    } else {
      // Fallback to local state management
      const updatedNodes = nodes.map(node => {
        if (node.id === fromNodeId) {
          const connections = node.connections.includes(toNodeId) 
            ? node.connections.filter(id => id !== toNodeId)
            : [...node.connections, toNodeId];
          return { ...node, connections };
        }
        // Also add bidirectional connection
        if (node.id === toNodeId && !node.connections.includes(fromNodeId)) {
          return { ...node, connections: [...node.connections, fromNodeId] };
        }
        return node;
      });

      onNodeUpdate(updatedNodes);
    }
    setConnectingMode(null);
  }, [nodes, onNodeUpdate]);

  // Handle double-click to open node details
  const handleNodeDoubleClick = useCallback((node: ContentNode) => {
    // Clear any pending single-click timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    
    // Only open node if not in connecting mode and not being dragged
    if (!connectingMode && !draggedNode) {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node);
      } else {
        onNodeClick(node);
      }
    }
  }, [clickTimeout, connectingMode, draggedNode, onNodeClick, onNodeDoubleClick]);

  // Handle single click (for selection/connection only)
  const handleNodeSingleClick = useCallback((e: React.MouseEvent, node: ContentNode) => {
    e.stopPropagation();
    
    // Handle connection mode
    if (connectingMode) {
      if (connectingMode !== node.id) {
        handleConnect(connectingMode, node.id);
      }
      return;
    }
  }, [connectingMode, handleConnect]);

  const removeConnection = (fromNodeId: string, toNodeId: string) => {
    if (createOrDeleteEdge) {
      // Use API-based edge management
      createOrDeleteEdge(fromNodeId, toNodeId);
    } else {
      // Fallback to local state management
      const updatedNodes = nodes.map(node => 
        node.id === fromNodeId 
          ? { ...node, connections: node.connections.filter(id => id !== toNodeId) }
          : node
      );
      onNodeUpdate(updatedNodes);
    }
  };

  React.useLayoutEffect(() => {
    if (!canvasRef.current || !helpRef.current || helpPos) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const helpRect = helpRef.current.getBoundingClientRect();

    const x = canvasRect.width - helpRect.width - 24;
    const y = 24;
    setHelpPos({ x: Math.max(0, x), y: Math.max(0, y) });
  }, [helpPos]);

  const onHelpMouseDown = (e: React.MouseEvent) => {
    if (!helpRef.current || !canvasRef.current || !helpPos) return;
    e.preventDefault();

    const rect = helpRef.current.getBoundingClientRect();
    setHelpDragging(true);
    document.body.classList.add('dragging');

    setHelpOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const onHelpMouseMove = useCallback((e: MouseEvent) => {
    if (!helpDragging || !canvasRef.current || !helpRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const helpRect = helpRef.current.getBoundingClientRect();

    const newX = e.clientX - canvasRect.left - helpOffset.x;
    const newY = e.clientY - canvasRect.top - helpOffset.y;

    // clamp inside canvas
    const maxX = canvasRect.width - helpRect.width;
    const maxY = canvasRect.height - helpRect.height;

    setHelpPos({
      x: Math.min(Math.max(0, newX), Math.max(0, maxX)),
      y: Math.min(Math.max(0, newY), Math.max(0, maxY)),
    });
  }, [helpDragging, helpOffset]);

  const onHelpMouseUp = () => {
    if (!helpDragging) return;
    setHelpDragging(false);
    document.body.classList.remove('dragging');
  };

  React.useEffect(() => {
    if (!helpDragging) return;
    const move = (e: MouseEvent) => onHelpMouseMove(e);
    const up = () => onHelpMouseUp();
    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseup', up, { passive: true });
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
  }, [helpDragging, onHelpMouseMove]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Canvas background click no longer switches to canvas mode
    // Only clear connecting mode if active
    if (e.target === e.currentTarget && connectingMode) {
      setConnectingMode(null);
    }
  }, [connectingMode]);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full p-6 overflow-auto scrollbar-hide bg-gradient-to-br from-background/50 to-background/80 no-select"
      style={{ 
        cursor: isDragging ? 'grabbing' : 'default',
        willChange: isDragging ? 'transform' : 'auto',
      }}
      onClick={handleCanvasClick}
    >
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
          </linearGradient>
          <filter id="connectionGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        {nodes.map(node => 
          node.connections.map(connectedId => {
            const connectedNode = nodes.find(n => n.id === connectedId);
            if (!connectedNode) {
              console.warn(`Connected node not found: ${connectedId} for node ${node.id}`);
              return null;
            }
            
            // Calculate connection points (center of nodes)
            const startX = (draggedNode === node.id ? draggedPosition.x : node.position.x) + 120;
            const startY = (draggedNode === node.id ? draggedPosition.y : node.position.y) + 100;
            const endX = (draggedNode === connectedNode.id ? draggedPosition.x : connectedNode.position.x) + 120;
            const endY = (draggedNode === connectedNode.id ? draggedPosition.y : connectedNode.position.y) + 100;
            
            return (
              <g key={`${node.id}-${connectedId}`}>
                {/* Glow effect */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeOpacity="0.2"
                  filter="url(#connectionGlow)"
                />
                {/* Main line */}
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="url(#connectionGradient)"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                  className="transition-all duration-300"
                  style={{
                    animation: 'dash 2s linear infinite'
                  }}
                />
                {/* Connection points */}
                <circle
                  cx={startX}
                  cy={startY}
                  r="3"
                  fill="hsl(var(--primary))"
                  opacity="0.8"
                />
                <circle
                  cx={endX}
                  cy={endY}
                  r="3"
                  fill="hsl(var(--primary))"
                  opacity="0.8"
                />
              </g>
            );
          })
        )}
      </svg>
      
      {/* CSS for animated dashes */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
      `}</style>

      {/* Nodes */}
      {nodes.map(node => {
        const TypeIcon = getTypeIcon(node.type);
        const isConnecting = connectingMode === node.id;
        const canConnect = connectingMode && connectingMode !== node.id;
        
        return (
          <Card
            key={node.id}
            className={`node-card absolute w-60 p-4 bg-card/90 backdrop-blur-sm border-2 z-10 no-select ${
              draggedNode === node.id 
                ? 'dragging dragging-node border-primary cursor-grabbing will-change-transform' 
                : (node.postedAt && node.postedTo && node.postedTo.length > 0)
                ? 'border-green-500/70 hover:border-green-500 cursor-grab hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/25 transition-all duration-200 ease-out transform-gpu'
                : 'border-primary/30 hover:border-primary/70 cursor-grab hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/25 transition-all duration-200 ease-out transform-gpu'
            } ${
              isConnecting 
                ? 'ring-2 ring-primary/70 border-primary' 
                : ''
            } ${
              canConnect 
                ? 'ring-2 ring-accent/70 border-accent animate-node-pulse cursor-pointer' 
                : ''
            } ${
              (node.postedAt && node.postedTo && node.postedTo.length > 0)
                ? 'border-green-500/50 hover:border-green-500/70'
                : node.status === 'published' 
                ? 'border-success/50 hover:border-success/70' 
                : node.status === 'scheduled' 
                ? 'border-accent/50 hover:border-accent/70' 
                : 'border-muted/50 hover:border-muted/70'
            }`}
            style={{
              left: draggedNode === node.id ? draggedPosition.x : node.position.x,
              top: draggedNode === node.id ? draggedPosition.y : node.position.y,
              transform: draggedNode === node.id 
                ? 'translateZ(0)' // Force GPU acceleration for dragged node
                : 'translateZ(0)',
              willChange: draggedNode === node.id ? 'transform' : 'auto',
              transition: draggedNode === node.id 
                ? 'none' // No transition during drag for immediate response
                : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease-out',
            }}
            title="Double-click to open details"
            onMouseDown={(e) => {
              if (!canConnect) {
                handleMouseDown(e, node.id);
              }
            }}
            onClick={(e) => handleNodeSingleClick(e, node)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleNodeDoubleClick(node);
            }}
          >
            {/* Node Controls - 2 buttons: Delete, Link */}
            <div 
              className="absolute top-2 right-2 flex gap-1 z-50 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Delete Button */}
              {onDeleteNode && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive/50 pointer-events-auto"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    console.log('Delete button clicked for node:', node.id);
                    e.stopPropagation();
                    e.preventDefault();
                    onDeleteNode(node.id);
                  }}
                  title="Delete node"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              
              {/* Link Button */}
              <Button
                size="sm"
                variant="outline"
                className={`h-6 w-6 p-0 pointer-events-auto ${
                  connectingMode === node.id 
                    ? 'bg-primary text-primary-foreground border-primary/50' 
                    : 'bg-accent hover:bg-accent/90 border-accent/50'
                }`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  console.log('Link button clicked for node:', node.id);
                  e.stopPropagation();
                  e.preventDefault();
                  if (connectingMode === node.id) {
                    setConnectingMode(null);
                  } else {
                    setConnectingMode(node.id);
                  }
                }}
                title={connectingMode === node.id ? "Cancel linking" : "Link to other nodes"}
              >
                <Link className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <TypeIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-xs">{node.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{node.day + " - " + node.type}</p>
                </div>
              </div>
              
              {/* Posted Indicator */}
              {node.postedAt && node.postedTo && node.postedTo.length > 0 && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400" title={`Posted to ${node.postedTo.join(', ')} on ${node.postedAt.toLocaleDateString()}`}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Posted</span>
                </div>
              )}
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
                  <div className="flex gap-1 flex-wrap">
                    {node.connections.map(connId => {
                      const connectedNode = nodes.find(n => n.id === connId);
                      return (
                        <Button
                          key={connId}
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeConnection(node.id, connId);
                          }}
                          title={`Disconnect from: ${connectedNode?.title || connId}`}
                        >
                          <X className="w-2 h-2 mr-1" />
                          {connectedNode?.title?.slice(0, 8) || connId.slice(0, 8)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}

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

      {/* Usage Instructions */}
      {helpVisible && (
        <div
          ref={helpRef}
          className={`absolute bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 z-30 ${
            helpDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            left: helpPos ? helpPos.x : 24,
            top: helpPos ? helpPos.y : 24,
            width: 220,
            userSelect: 'none',
          }}
          onMouseDown={onHelpMouseDown}
          title="Drag me"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Content Canvas</p>
            </div>
            <button
              onMouseDown={(e) => e.stopPropagation()}  // <— add this
              onClick={(e) => {
                e.stopPropagation();
                setHelpVisible(false);
              }}
              className="p-1 rounded hover:bg-destructive/20 text-destructive transition"
              title="Hide instructions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• <strong>Drag</strong> to move nodes</p>
            <p>• <strong>Double-click</strong> to open details</p>
            <p>• <strong>Link icon</strong> to connect nodes</p>
          </div>
        </div>
      )}
    </div>
  );
};