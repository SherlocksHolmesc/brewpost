import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  Eye,
  Zap,
  CalendarIcon,
  Clock,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

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

interface AddNodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNode: (node: Omit<ContentNode, 'id'>) => void;
  existingNodes: ContentNode[];
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  open,
  onOpenChange,
  onAddNode,
  existingNodes
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'post' | 'image' | 'story'>('post');
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    const finalScheduledDate = scheduledDate && status === 'scheduled' 
      ? new Date(`${scheduledDate.toDateString()} ${scheduledTime}`)
      : undefined;

    const newNode: Omit<ContentNode, 'id'> = {
      title: title.trim(),
      content: content.trim(),
      type,
      status,
      scheduledDate: finalScheduledDate,
      connections: selectedConnections,
      position: { 
        x: Math.random() * 300 + 50, 
        y: Math.random() * 200 + 50 
      },
    };

    onAddNode(newNode);
    
    // Reset form
    setTitle('');
    setContent('');
    setType('post');
    setStatus('draft');
    setScheduledDate(undefined);
    setScheduledTime('09:00');
    setSelectedConnections([]);
    onOpenChange(false);
  };

  const toggleConnection = (nodeId: string) => {
    setSelectedConnections(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const getTypeIcon = (nodeType: 'post' | 'image' | 'story') => {
    switch (nodeType) {
      case 'post': return Target;
      case 'image': return Eye;
      case 'story': return Zap;
    }
  };

  const TypeIcon = getTypeIcon(type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Add New Content Node</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a new content piece for your planning workflow
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Content Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title..."
                  className="glow-focus border-primary/20 focus:border-primary/40"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Content Type</Label>
                <Select value={type} onValueChange={(value: 'post' | 'image' | 'story') => setType(value)}>
                  <SelectTrigger className="glow-focus border-primary/20 focus:border-primary/40">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>Social Post</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="image">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>Image/Visual</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="story">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>Story/Video</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content Description</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the content you want to create..."
                className="min-h-[100px] glow-focus border-primary/20 focus:border-primary/40"
              />
            </div>
          </div>

          {/* Status & Scheduling */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Status & Scheduling</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: 'draft' | 'scheduled') => setStatus(value)}>
                  <SelectTrigger className="glow-focus border-primary/20 focus:border-primary/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'scheduled' && (
                <div className="space-y-2">
                  <Label>Schedule Date & Time</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left border-primary/20 hover:border-primary/40"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, 'PP') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-32 glow-focus border-primary/20 focus:border-primary/40"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connections */}
          {existingNodes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Connect to Existing Nodes</h3>
              <div className="flex flex-wrap gap-2">
                {existingNodes.map(node => {
                  const NodeTypeIcon = getTypeIcon(node.type);
                  const isSelected = selectedConnections.includes(node.id);
                  
                  return (
                    <Badge
                      key={node.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-gradient-primary text-white border-primary' 
                          : 'border-primary/20 hover:border-primary/40'
                      }`}
                      onClick={() => toggleConnection(node.id)}
                    >
                      <NodeTypeIcon className="w-3 h-3 mr-1" />
                      {node.title}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border/20">
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim()}
              className="bg-gradient-primary hover:opacity-90 glow-hover flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Node
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-primary/20 hover:border-primary/40"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};