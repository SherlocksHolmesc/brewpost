import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarView } from '@/components/calendar/CalendarView';

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

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledNodes: ContentNode[];
  editable?: boolean;
  onEditNode?: (node: ContentNode) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  onOpenChange,
  scheduledNodes,
  editable = true,
  onEditNode
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Calendar Preview</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">
          <CalendarView 
            scheduledNodes={scheduledNodes}
            onClose={() => onOpenChange(false)}
            editable={editable}
            onEditNode={onEditNode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};