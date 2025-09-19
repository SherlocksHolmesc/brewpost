import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarEventModal } from '@/components/modals/CalendarEventModal';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus
} from 'lucide-react';

interface ScheduledContent {
  id: string;
  title: string;
  type: 'post' | 'image' | 'story';
  time: string;
  status: 'scheduled' | 'published';
}

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

interface CalendarViewProps {
  scheduledNodes?: ContentNode[];
  onClose: () => void;
  onUpdateNode?: (updatedNode: ContentNode) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  scheduledNodes = [], 
  onClose, 
  onUpdateNode, 
  onDeleteNode 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ContentNode | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Helper function to format date keys
  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Convert scheduled nodes to calendar format
  const scheduledContent: Record<string, ScheduledContent[]> = {};
  
  scheduledNodes.forEach(node => {
    if (node.scheduledDate) {
      const dateKey = formatDateKey(
        node.scheduledDate.getFullYear(),
        node.scheduledDate.getMonth(),
        node.scheduledDate.getDate()
      );
      if (!scheduledContent[dateKey]) {
        scheduledContent[dateKey] = [];
      }
      scheduledContent[dateKey].push({
        id: node.id,
        title: node.title,
        type: node.type,
        time: node.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: node.status as 'scheduled' | 'published'
      });
    }
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };


  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card/95 backdrop-blur-xl border-border/50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Content Calendar</h2>
            </div>
            <Button variant="outline" onClick={onClose} className="border-primary/20 hover:border-primary/40">
              Close
            </Button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('prev')}
              className="border-primary/20 hover:border-primary/40"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h3 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateMonth('next')}
              className="border-primary/20 hover:border-primary/40"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-3"></div>;
              }
              
              const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayContent = scheduledContent[dateKey] || [];
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <Card 
                  key={day} 
                  className={`p-2 min-h-[100px] ${isToday ? 'border-primary bg-primary/5' : 'border-border/20'} hover:border-primary/40 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                      {day}
                    </span>
                    {dayContent.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayContent.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayContent.slice(0, 2).map(content => {
                      const fullEvent = scheduledNodes.find(node => node.id === content.id);
                      return (
                        <div 
                          key={content.id} 
                          className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                            content.status === 'published' 
                              ? 'bg-success/20 text-success-foreground' 
                              : 'bg-primary/20 text-primary-foreground'
                          }`}
                          onClick={() => {
                            if (fullEvent) {
                              setSelectedEvent(fullEvent);
                              setShowEventModal(true);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{content.time}</span>
                          </div>
                          <div className="truncate font-medium">
                            {content.title}
                          </div>
                        </div>
                      );
                    })}
                    {dayContent.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayContent.length - 2} more
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/20 rounded"></div>
              <span className="text-muted-foreground">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success/20 rounded"></div>
              <span className="text-muted-foreground">Published</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Calendar Event Edit Modal */}
      <CalendarEventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        event={selectedEvent}
        onSave={(updatedEvent) => {
          if (onUpdateNode) {
            onUpdateNode(updatedEvent);
          }
        }}
        onDelete={(eventId) => {
          if (onDeleteNode) {
            onDeleteNode(eventId);
          }
        }}
      />
    </div>
  );
};