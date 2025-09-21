import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentModal } from '@/components/modals/ContentModal';
import { DraggableNodeCanvas } from '@/components/planning/DraggableNodeCanvas';
import { AddNodeModal } from '@/components/modals/AddNodeModal';
import { ScheduleConfirmationModal } from '@/components/modals/ScheduleConfirmationModal';
import { CalendarModal } from '@/components/modals/CalendarModal';
import { EditNodeModal } from '@/components/modals/EditNodeModal';
import { NodeAPI } from '@/services/nodeService';
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
import { v4 as uuidv4 } from 'uuid'; // optional, or use Date.now()
import { useLocation } from 'react-router-dom';

type PlannerNode = {
  day: string;
  title: string;
  caption: string;
  imagePrompt: string;
};

export type ContentNode = {
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
};

interface PlanningPanelProps {
  nodes: ContentNode[];
  setNodes: React.Dispatch<React.SetStateAction<ContentNode[]>>;
}

export const PlanningPanel: React.FC<PlanningPanelProps> = ({ nodes, setNodes }) => {
  const navigate = useNavigate();
  const projectId = 'demo-project-123'; // using a more realistic demo project ID
  const [edgesByKey, setEdgesByKey] = useState<Record<string,string>>({}); // "from->to" : edgeId
  const [selectedNode, setSelectedNode] = useState<ContentNode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleConfirmation, setShowScheduleConfirmation] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNode, setEditingNode] = useState<ContentNode | null>(null);
  const persistPositions = useRef<NodeJS.Timeout | null>(null);

  // Calculate node counts by status
  const getNodeCounts = () => {
    const posted = nodes.filter(node => node.postedAt && node.postedTo && node.postedTo.length > 0).length;
    const published = nodes.filter(node => node.status === 'published' && !(node.postedAt && node.postedTo && node.postedTo.length > 0)).length;
    const scheduled = nodes.filter(node => node.status === 'scheduled').length;
    const drafts = nodes.filter(node => node.status === 'draft').length;
    return { posted, published, scheduled, drafts };
  };

  const { posted, published, scheduled, drafts } = getNodeCounts();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeData = async () => {
      try {
        console.log('Initializing data for project:', projectId);
        
        // Try to load nodes
        try {
          const n = await NodeAPI.list(projectId);
          console.log('Loaded nodes:', n);
          // transform NodeDTO -> ContentNode used by your UI
          setNodes(n.map(x => ({
            id: x.nodeId,
            title: x.title,
            type: 'post',              // map if you store type in description/status/etc.
            status: (x.status as any) ?? 'draft',
            scheduledDate: undefined,
            content: x.description ?? '',
            imageUrl: undefined,
            connections: [],           // we'll fill from edges below
            position: { x: x.x ?? 0, y: x.y ?? 0 },
          })));
        } catch (nodeError) {
          console.warn('Failed to load nodes, using fallback data:', nodeError);
          // Use fallback demo data if API fails
          setNodes([
            {
              id: 'demo-1',
              title: 'Demo Post',
              type: 'post',
              status: 'draft',
              content: 'This is a demo post while API is being set up.',
              connections: [],
              position: { x: 100, y: 100 }
            }
          ]);
        }

        // Try to load edges
        try {
          const edges = await NodeAPI.listEdges(projectId);
          console.log('Loaded edges:', edges);
          setNodes(curr => curr.map(nd => ({
            ...nd,
            connections: edges.filter(e => e.from === nd.id).map(e => e.to),
          })));
          
          // Update edge map
          setEdgesByKey(Object.fromEntries(edges.map(e => [`${e.from}->${e.to}`, e.edgeId])));
        } catch (edgeError) {
          console.warn('Failed to load edges:', edgeError);
        }

        // Set up subscriptions (only if API calls work)
        try {
          unsubscribe = NodeAPI.subscribe(projectId, ({ type, payload }) => {
            console.log('Subscription event:', type, payload);
            setNodes(curr => {
              if (type === 'created') {
                const nd = payload;
                return [...curr, {
                  id: nd.nodeId, title: nd.title, type: 'post', status: nd.status ?? 'draft',
                  content: nd.description ?? '', imageUrl: undefined,
                  connections: [], position: { x: nd.x ?? 0, y: nd.y ?? 0 },
                }];
              }
              if (type === 'updated') {
                return curr.map(n => n.id === payload.nodeId
                  ? { ...n, title: payload.title, content: payload.description ?? '', status: payload.status ?? n.status,
                      position: { x: payload.x ?? n.position.x, y: payload.y ?? n.position.y } }
                  : n);
              }
              if (type === 'deleted') {
                console.log('Subscription received delete event for node:', payload.nodeId);
                // Only remove if the node actually exists (avoid double deletion from optimistic updates)
                return curr.filter(n => n.id !== payload.nodeId)
                           .map(n => ({ ...n, connections: n.connections.filter(c => c !== payload.nodeId) }));
              }
              if (type === 'edge') {
                // simple reconcile of connections
                const e = payload;
                return curr.map(n => n.id === e.from
                  ? { ...n, connections: Array.from(new Set([...n.connections.filter(x => x !== e.to), e.to])) }
                  : n);
              }
              return curr;
            });
          });
        } catch (subscriptionError) {
          console.warn('Failed to set up subscriptions:', subscriptionError);
        }
      } catch (error) {
        console.error('Failed to initialize planning panel:', error);
      }
    };

    initializeData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [projectId]);

  const handleNodeClick = (node: ContentNode) => {
    setSelectedNode(node);
    setShowModal(true);
  };

  const handleEditNode = (node: ContentNode) => {
    setEditingNode(node);
    setShowEditModal(true);
  };

  const handleSaveEditedNode = async (updatedNode: ContentNode) => {
    // Optimistic update - update UI immediately
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    
    try {
      await NodeAPI.update({
        projectId,
        nodeId: updatedNode.id,
        title: updatedNode.title,
        description: updatedNode.content,
        status: updatedNode.status,
      });
      console.log('Node updated successfully');
      
      // If the node was posted, also log the posting information
      if (updatedNode.postedAt && updatedNode.postedTo) {
        console.log('Content posted successfully:', {
          nodeId: updatedNode.id,
          postedAt: updatedNode.postedAt,
          postedTo: updatedNode.postedTo,
          tweetId: updatedNode.tweetId
        });
      }
    } catch (error) {
      console.error('Failed to update node:', error);
      // Could revert the optimistic update here if needed
    }
  };

  const handleNodeUpdate = (updated: ContentNode[]) => {
    // Update UI immediately for smooth dragging
    setNodes(updated);
    
    // Debounce AWS position updates with longer delay
    if (persistPositions.current) clearTimeout(persistPositions.current);
    persistPositions.current = setTimeout(() => {
      // Only update positions that have actually changed
      updated.forEach(n => {
        const originalNode = nodes.find(orig => orig.id === n.id);
        if (originalNode && 
            (originalNode.position.x !== n.position.x || originalNode.position.y !== n.position.y)) {
          NodeAPI.update({ 
            projectId, 
            nodeId: n.id, 
            x: n.position.x, 
            y: n.position.y 
          }).catch(error => {
            // Silently handle position update errors during dragging
            console.warn(`Position update failed for node ${n.id}:`, error.message || 'Unknown error');
          });
        }
      });
    }, 500); // Increased debounce delay for better performance
  };

  const handleAddNode = async (nodeData: Omit<ContentNode,'id'|'connections'>) => {
    // Optimistic update - add to UI immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticNode: ContentNode = {
      ...nodeData,
      id: tempId,
      connections: []
    };
    
    setNodes(prevNodes => [...prevNodes, optimisticNode]);
    
    try {
      const res = await NodeAPI.create({
        projectId,
        title: nodeData.title,
        description: nodeData.content,
        x: nodeData.position?.x ?? 0,
        y: nodeData.position?.y ?? 0,
        status: nodeData.status,
        contentId: undefined,
      });
      
      // Replace the optimistic node with the real one from AWS
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === tempId 
            ? {
                id: res.nodeId,
                title: res.title,
                type: 'post',
                status: (res.status as any) ?? 'draft',
                content: res.description ?? '',
                imageUrl: undefined,
                connections: [],
                position: { x: res.x ?? 0, y: res.y ?? 0 },
                scheduledDate: undefined
              }
            : node
        )
      );
      
      console.log('Node created successfully:', res);
    } catch (error) {
      console.error('Failed to create node:', error);
      // Remove the optimistic node if creation failed
      setNodes(prevNodes => prevNodes.filter(node => node.id !== tempId));
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    console.log('handleDeleteNode called with nodeId:', nodeId);
    
    // Optimistic update - remove from UI immediately
    const previousNodes = nodes;
    const optimisticNodes = nodes.filter(node => node.id !== nodeId);
    setNodes(optimisticNodes);
    console.log('Node removed from UI immediately, calling API...');
    
    try {
      await NodeAPI.remove(projectId, nodeId);
      console.log('Node deleted successfully from server');
      // Keep the optimistic update - ensure node stays deleted
      setNodes(currentNodes => currentNodes.filter(node => node.id !== nodeId));
    } catch (error) {
      console.error('Failed to delete node from server:', error);
      // Only revert if there was a real server error (not GraphQL response issues)
      if (error && typeof error === 'object' && 'networkError' in error) {
        console.warn('Network error - restoring node to UI');
        setNodes(previousNodes);
      } else {
        console.log('Node was likely deleted on server despite GraphQL response issues - keeping UI updated');
        // Ensure the node stays deleted even if GraphQL has issues
        setNodes(currentNodes => currentNodes.filter(node => node.id !== nodeId));
      }
    }
  };

  const createOrDeleteEdge = async (from: string, to: string) => {
    const key = `${from}->${to}`;
    const existing = edgesByKey[key];
    
    if (existing) {
      // Optimistic removal
      setEdgesByKey(m => { const { [key]:_, ...rest } = m; return rest; });
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === from 
          ? { ...node, connections: node.connections.filter(c => c !== to) }
          : node
      ));
      
      try {
        await NodeAPI.deleteEdge(projectId, existing);
        console.log('Edge deleted successfully');
      } catch (error) {
        console.error('Failed to delete edge:', error);
        // Revert optimistic update
        setEdgesByKey(m => ({ ...m, [key]: existing }));
        setNodes(prevNodes => prevNodes.map(node => 
          node.id === from 
            ? { ...node, connections: [...node.connections, to] }
            : node
        ));
      }
    } else {
      // Optimistic addition
      const tempEdgeId = `temp-edge-${Date.now()}`;
      setEdgesByKey(m => ({ ...m, [key]: tempEdgeId }));
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === from 
          ? { ...node, connections: Array.from(new Set([...node.connections, to])) }
          : node
      ));
      
      try {
        const e = await NodeAPI.createEdge(projectId, from, to);
        setEdgesByKey(m => ({ ...m, [key]: e.edgeId }));
        console.log('Edge created successfully');
      } catch (error) {
        console.error('Failed to create edge:', error);
        // Revert optimistic update
        setEdgesByKey(m => { const { [key]:_, ...rest } = m; return rest; });
        setNodes(prevNodes => prevNodes.map(node => 
          node.id === from 
            ? { ...node, connections: node.connections.filter(c => c !== to) }
            : node
        ));
      }
    }
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Posted: {posted}</span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-muted-foreground">Published: {published}</span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-xs text-muted-foreground">Scheduled: {scheduled}</span>
            </div>
          </Card>
          <Card className="px-3 py-2 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <span className="text-xs text-muted-foreground">Drafts: {drafts}</span>
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
          onEditNode={handleEditNode}
          createOrDeleteEdge={createOrDeleteEdge}
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
        onEditNode={handleEditNode}
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

      {/* Edit Node Modal */}
      <EditNodeModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        node={editingNode}
        onSave={handleSaveEditedNode}
      />
    </div>
  );
};