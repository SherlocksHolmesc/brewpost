import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  Share2,
  Edit,
  Download,
  Target,
  Eye,
  Zap,
  Image as ImageIcon
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
}

interface ContentModalProps {
  node: ContentNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({ 
  node, 
  open, 
  onOpenChange 
}) => {
  if (!node) return null;

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

  const TypeIcon = getTypeIcon(node.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{node.title}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground capitalize">
                  {node.type} content • ID: {node.id}
                </DialogDescription>
              </div>
            </div>
            <Badge className={`${getStatusColor(node.status)} border-none`}>
              {node.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview */}
          <div>
            <h3 className="text-sm font-medium mb-3">Content Preview</h3>
            <Card className="p-4 bg-gradient-subtle border-border/30">
              {node.type === 'image' && (
                <div className="w-full h-48 bg-gradient-secondary rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-white/80 mx-auto mb-2" />
                    <p className="text-white/80 text-sm">Generated Image Preview</p>
                  </div>
                </div>
              )}
              <p className="text-sm leading-relaxed">{node.content}</p>
            </Card>
          </div>

          {/* Scheduling Info */}
          {node.scheduledDate && (
            <div>
              <h3 className="text-sm font-medium mb-3">Schedule Details</h3>
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {node.scheduledDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {node.scheduledDate.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Connections */}
          {node.connections.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Connected Content</h3>
              <div className="space-y-2">
                {node.connections.map((connectionId) => (
                  <Card key={connectionId} className="p-3 bg-card/50 backdrop-blur-sm border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-accent rounded-md flex items-center justify-center">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">Connected Node {connectionId}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator className="opacity-50" />

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button className="bg-gradient-primary hover:opacity-90 glow-hover">
              <Edit className="w-4 h-4 mr-2" />
              Edit Content
            </Button>
            
            <Button variant="outline" className="border-primary/20 hover:border-primary/40 glow-hover">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            
            <Button variant="outline" className="border-primary/20 hover:border-primary/40">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button variant="outline" className="border-primary/20 hover:border-primary/40">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};