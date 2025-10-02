import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Eye, Target, Zap, Send, Save } from 'lucide-react';
import type { ContentNode } from '@/components/planning/PlanningPanel';

interface NodeDetailsProps {
  node: ContentNode | null;
  onSaveNode?: (node: ContentNode) => void;
  onPostNode?: (node: ContentNode) => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, onSaveNode, onPostNode }) => {
  console.log('NodeDetails rendering with node:', node?.title);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedNode, setEditedNode] = useState<ContentNode | null>(null);
  
  React.useEffect(() => {
    if (node) {
      setEditedNode({ ...node });
      setIsEditing(false);
    }
  }, [node]);
  
  if (!node) {
    return (
      <div className="flex flex-col h-full bg-gradient-subtle">
        <div className="p-6 border-b border-border/20">
          <h2 className="text-xl font-semibold">Node Details</h2>
          <p className="text-sm text-muted-foreground">Select a node to view its details</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click on a node in the planning canvas to view its details</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: ContentNode['status']) => {
    switch (status) {
      case 'published': return 'bg-success text-success-foreground';
      case 'scheduled': return 'bg-primary text-primary-foreground';
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

  const TypeIcon = getTypeIcon(node.type);

  return (
    <div className="flex flex-col h-full bg-gradient-subtle">
      {/* Header */}
      <div className="p-4 border-b border-border/20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <TypeIcon className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{node.title}</h2>
              <p className="text-sm text-muted-foreground font-mono">{node.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(node.status)}>
              {node.status}
            </Badge>
            <Badge variant="outline">
              {node.type}
            </Badge>
          </div>
        </div>
        {node.day && (
          <Badge variant="secondary" className="w-fit">
            {node.day}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Main Content */}
        <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Content
          </h3>
          {isEditing ? (
            <Textarea
              value={editedNode?.content || ''}
              onChange={(e) => setEditedNode(prev => prev ? { ...prev, content: e.target.value } : null)}
              className="min-h-[120px] text-sm"
              placeholder="Enter content..."
            />
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {node.content || 'No content available'}
            </div>
          )}
        </Card>

        {/* Image Preview */}
        {node.imageUrl && (
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2">Image</h3>
            <img 
              src={node.imageUrl} 
              alt={node.title}
              className="w-full max-h-64 object-contain rounded-md border border-border/20"
            />
          </Card>
        )}

        {/* Image Prompt */}
        {node.imagePrompt && (
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2">Image Prompt</h3>
            <div className="text-sm text-muted-foreground">
              {node.imagePrompt}
            </div>
          </Card>
        )}

        {/* Schedule Information */}
        {node.scheduledDate && (
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </h3>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3" />
                {node.scheduledDate.toLocaleDateString()} at {node.scheduledDate.toLocaleTimeString()}
              </div>
            </div>
          </Card>
        )}

        {/* Posted Information */}
        {node.postedAt && node.postedTo && (
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Posted
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <div>Posted on: {node.postedAt.toLocaleDateString()} at {node.postedAt.toLocaleTimeString()}</div>
              <div>Platforms: {node.postedTo.join(', ')}</div>
              {node.tweetId && (
                <div>Tweet ID: {node.tweetId}</div>
              )}
            </div>
          </Card>
        )}

        {/* Connections */}
        {node.connections && node.connections.length > 0 && (
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2">Connected Nodes</h3>
            <div className="text-sm text-muted-foreground">
              {node.connections.length} connection{node.connections.length !== 1 ? 's' : ''}
            </div>
          </Card>
        )}

        {/* Title */}
        <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-sm font-medium mb-2">Title</h3>
          {isEditing ? (
            <Input
              value={editedNode?.title || ''}
              onChange={(e) => setEditedNode(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder="Enter title..."
            />
          ) : (
            <div className="text-sm text-muted-foreground">{node.title}</div>
          )}
        </Card>

        {/* Status and Type */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2">Status</h3>
            {isEditing ? (
              <Select
                value={editedNode?.status || 'draft'}
                onValueChange={(value: 'draft' | 'scheduled' | 'published') => 
                  setEditedNode(prev => prev ? { ...prev, status: value } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground capitalize">{node.status}</div>
            )}
          </Card>

          <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-sm font-medium mb-2">Type</h3>
            {isEditing ? (
              <Select
                value={editedNode?.type || 'post'}
                onValueChange={(value: 'post' | 'image' | 'story') => 
                  setEditedNode(prev => prev ? { ...prev, type: value } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground capitalize">{node.type}</div>
            )}
          </Card>
        </div>

        {/* Day */}
        <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-sm font-medium mb-2">Day</h3>
          {isEditing ? (
            <Input
              value={editedNode?.day || ''}
              onChange={(e) => setEditedNode(prev => prev ? { ...prev, day: e.target.value } : null)}
              placeholder="e.g., Monday, Tuesday..."
            />
          ) : (
            <div className="text-sm text-muted-foreground">{node.day || 'No day specified'}</div>
          )}
        </Card>

        {/* Image URL */}
        <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-sm font-medium mb-2">Image URL</h3>
          {isEditing ? (
            <Input
              value={editedNode?.imageUrl || ''}
              onChange={(e) => setEditedNode(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
              placeholder="https://example.com/image.jpg"
            />
          ) : (
            <div className="text-sm text-muted-foreground">{node.imageUrl || 'No image URL'}</div>
          )}
        </Card>

        {/* Image Prompt */}
        <Card className="p-3 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-sm font-medium mb-2">Image Prompt</h3>
          {isEditing ? (
            <Textarea
              value={editedNode?.imagePrompt || ''}
              onChange={(e) => setEditedNode(prev => prev ? { ...prev, imagePrompt: e.target.value } : null)}
              className="min-h-[80px] text-sm"
              placeholder="Enter image prompt..."
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              {node.imagePrompt || 'No image prompt'}
            </div>
          )}
        </Card>

        {/* Scheduled Date */}
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="font-medium mb-3">Scheduled Date</h3>
          {isEditing ? (
            <Input
              type="datetime-local"
              value={editedNode?.scheduledDate ? new Date(editedNode.scheduledDate.getTime() - editedNode.scheduledDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
              onChange={(e) => setEditedNode(prev => prev ? { ...prev, scheduledDate: e.target.value ? new Date(e.target.value) : undefined } : null)}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              {node.scheduledDate ? node.scheduledDate.toLocaleString() : 'No scheduled date'}
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-border/20 p-3 bg-card/50">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={() => {
                  if (editedNode && onSaveNode) {
                    onSaveNode(editedNode);
                    setIsEditing(false);
                  }
                }}
                className="bg-gradient-primary hover:opacity-90 flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditedNode({ ...node });
                  setIsEditing(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-primary/20 hover:border-primary/40 flex-1"
              >
                Edit Node
              </Button>
              {onPostNode && (
                <Button
                  onClick={() => onPostNode(node)}
                  className="bg-gradient-secondary hover:opacity-90 flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Now
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};