import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Target, Eye, Zap } from 'lucide-react';
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

interface ScheduleConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: ContentNode[];
  onConfirm: () => void;
}

export const ScheduleConfirmationModal: React.FC<ScheduleConfirmationModalProps> = ({
  open,
  onOpenChange,
  nodes,
  onConfirm
}) => {
  const getTypeIcon = (type: ContentNode['type']) => {
    switch (type) {
      case 'post': return Target;
      case 'image': return Eye;
      case 'story': return Zap;
      default: return Target;
    }
  };

  const getScheduledDate = (index: number) => {
    const today = new Date();
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + index);
    return scheduledDate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule All Content
          </DialogTitle>
          <DialogDescription>
            The following {nodes.length} content items will be scheduled starting from today:
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {nodes.map((node, index) => {
            const IconComponent = getTypeIcon(node.type);
            const scheduledDate = getScheduledDate(index);
            
            return (
              <Card key={node.id} className="p-3 bg-card/50 border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <IconComponent className="w-3 h-3 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{node.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{format(scheduledDate, 'MMM dd')}</p>
                    <p className="text-xs text-muted-foreground">{format(scheduledDate, 'EEE')}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-gradient-primary hover:opacity-90">
            <Clock className="w-4 h-4 mr-2" />
            Schedule All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};