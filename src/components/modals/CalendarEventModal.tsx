import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Target, Eye, Zap, Bot, Send } from 'lucide-react';
import { AIChat } from '@/components/ai/AIChat';

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

interface CalendarEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ContentNode | null;
  onSave: (updatedEvent: ContentNode) => void;
  onDelete?: (eventId: string) => void;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  open,
  onOpenChange,
  event,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<ContentNode>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        type: event.type,
        status: event.status,
        content: event.content,
        scheduledDate: event.scheduledDate,
        imageUrl: event.imageUrl
      });
    }
  }, [event]);

  const handleSave = () => {
    if (!event) return;
    
    const updatedEvent: ContentNode = {
      ...event,
      ...formData,
      title: formData.title || event.title,
      type: formData.type || event.type,
      status: formData.status || event.status,
      content: formData.content || event.content,
      scheduledDate: formData.scheduledDate,
      imageUrl: formData.imageUrl
    };

    onSave(updatedEvent);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onOpenChange(false);
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

  const getStatusColor = (status: ContentNode['status']) => {
    switch (status) {
      case 'published': return 'bg-success text-success-foreground';
      case 'scheduled': return 'bg-gradient-primary text-white';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!event) return null;

  const TypeIcon = getTypeIcon(event.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
            Edit Scheduled Event
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Event</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Event Info */}
            <div className="flex items-center gap-2 p-3 bg-card/50 rounded-lg border border-border/20">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm">
                {event.scheduledDate?.toLocaleDateString()} at {event.scheduledDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <Badge className={`ml-auto ${getStatusColor(event.status)}`}>
                {event.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'post' | 'image' | 'story') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'scheduled' | 'published') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate ? 
                  new Date(formData.scheduledDate.getTime() - formData.scheduledDate.getTimezoneOffset() * 60000)
                    .toISOString().slice(0, 16) : ''
                }
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scheduledDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your content..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="h-[60vh]">
            <div className="h-full border border-border/20 rounded-lg">
              <AIChat />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} className="bg-gradient-primary">
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onDelete && (
            <Button 
              variant="outline" 
              onClick={handleDelete}
              className="ml-auto border-destructive/20 hover:border-destructive/40 text-destructive"
            >
              Delete Event
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};