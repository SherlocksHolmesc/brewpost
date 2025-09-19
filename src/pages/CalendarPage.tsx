import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, Target, Eye, Zap } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

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

export const CalendarPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const nodes = location.state?.nodes as ContentNode[] || [];
  const [currentDate, setCurrentDate] = useState(new Date());

  // Format date key for consistent date comparison
  const formatDateKey = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  // Group scheduled nodes by date
  const scheduledContent: Record<string, ContentNode[]> = {};
  nodes.forEach(node => {
    if (node.scheduledDate) {
      const dateKey = formatDateKey(node.scheduledDate);
      if (!scheduledContent[dateKey]) {
        scheduledContent[dateKey] = [];
      }
      scheduledContent[dateKey].push(node);
    }
  });

  // Get all days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for the calendar grid
  const startPadding = Array.from({ length: getDay(monthStart) }, (_, i) => {
    const paddingDate = new Date(monthStart);
    paddingDate.setDate(paddingDate.getDate() - (getDay(monthStart) - i));
    return paddingDate;
  });

  const endPadding = Array.from({ length: 6 - getDay(monthEnd) }, (_, i) => {
    const paddingDate = new Date(monthEnd);
    paddingDate.setDate(paddingDate.getDate() + i + 1);
    return paddingDate;
  });

  const allDays = [...startPadding, ...days, ...endPadding];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
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
      case 'published': return 'bg-success';
      case 'scheduled': return 'bg-primary';
      case 'draft': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="p-6 border-b border-border/20 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app')}
              className="border-primary/20 hover:border-primary/40"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Planning
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Content Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                {nodes.length} content items • {Object.keys(scheduledContent).length} scheduled days
              </p>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 min-w-[140px] text-center">
              <span className="font-semibold">{format(currentDate, 'MMMM yyyy')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {allDays.map((day, index) => {
              const dateKey = formatDateKey(day);
              const dayEvents = scheduledContent[dateKey] || [];
              const isCurrentMonth = day >= monthStart && day <= monthEnd;
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg transition-colors ${
                    isCurrentMonth 
                      ? 'bg-background/50 border-border/50' 
                      : 'bg-muted/20 border-border/20'
                  } ${isToday ? 'ring-2 ring-primary/30' : ''}`}
                >
                  <div className={`text-sm mb-1 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  } ${isToday ? 'font-bold text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => {
                      const IconComponent = getTypeIcon(event.type);
                      return (
                        <div
                          key={eventIndex}
                          className="flex items-center gap-1 p-1 rounded text-xs bg-primary/10 border border-primary/20"
                        >
                          <IconComponent className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="truncate text-primary" title={event.title}>
                            {event.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border/20">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>Post</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>Image</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Story</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/10 border border-primary/20 rounded"></div>
                <span>Scheduled Content</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};