import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Target, 
  Calendar, 
  ArrowRight, 
  Eye,
  Link,
  Home,
  Settings,
  BarChart3,
  Users,
  FileText,
  Layers,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Landing: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple demo login - in real app, this would be proper authentication
    if (email && password) {
      navigate('/app');
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Content',
      description: 'Generate stunning social media posts, blog headers, and marketing content with AI.'
    },
    {
      icon: Target,
      title: 'Visual Planning',
      description: 'Connect and organize your content with intuitive drag-and-drop node planning.'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Schedule your content across platforms with intelligent timing suggestions.'
    }
  ];

  // Sample node data for preview
  const sampleNodes = [
    {
      id: '1',
      title: 'Marketing Campaign',
      type: 'post' as const,
      status: 'published' as const,
      content: 'Launch our new product line with engaging social media content',
      connections: ['2', '3'],
      position: { x: 50, y: 50 }
    },
    {
      id: '2', 
      title: 'Brand Story',
      type: 'image' as const,
      status: 'scheduled' as const,
      content: 'Visual storytelling through compelling brand imagery',
      connections: ['1'],
      position: { x: 200, y: 120 }
    },
    {
      id: '3',
      title: 'User Generated Content',
      type: 'story' as const, 
      status: 'draft' as const,
      content: 'Curate and share customer success stories',
      connections: ['1'],
      position: { x: 80, y: 200 }
    }
  ];

  const navigationItems = [
    { icon: Home, label: 'Dashboard', active: false },
    { icon: Layers, label: 'Planning', active: false },
    { icon: Calendar, label: 'Calendar', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: FileText, label: 'Content', active: false },
    { icon: Users, label: 'Team', active: false },
    { icon: Settings, label: 'Settings', active: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Enhanced Snow Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Main snow particles */}
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-snow opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: `hsl(var(--primary))`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${5 + Math.random() * 15}s`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
        
        {/* Larger snow particles */}
        {[...Array(40)].map((_, i) => (
          <div
            key={`large-${i}`}
            className="absolute rounded-full animate-snow-delayed opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
              filter: 'blur(1px)',
            }}
          />
        ))}

        {/* Glowing particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`glow-${i}`}
            className="absolute rounded-full animate-float opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 12}px`,
              height: `${6 + Math.random() * 12}px`,
              background: `radial-gradient(circle, hsl(var(--primary)), transparent)`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
              filter: 'blur(2px)',
              boxShadow: `0 0 ${10 + Math.random() * 20}px hsl(var(--primary))`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-conic from-primary/15 via-accent/8 to-primary/15 animate-pulse"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/25 to-accent/25 rounded-full blur-3xl animate-float opacity-60"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-accent/25 to-primary/25 rounded-full blur-3xl animate-float-delayed opacity-60"></div>
      
      {/* Navigation Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center relative overflow-hidden">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-sweep"></div>
              </div>
              <div className="absolute -inset-1 bg-gradient-primary rounded-xl opacity-30 blur animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BrewPost
              </h1>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowLogin(true)}
            size="sm"
            variant="outline"
            className="border-primary/20 hover:border-primary/40"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-24">
            <div className="relative max-w-4xl mx-auto">
              {/* Floating elements around hero */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-primary rounded-full opacity-20 animate-float blur"></div>
              <div className="absolute -top-5 -right-5 w-12 h-12 bg-gradient-accent rounded-full opacity-30 animate-float-delayed blur"></div>
              
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent leading-tight">
                <span className="relative inline-block animate-pulse">Brew</span>{" "}
                <span className="relative inline-block animate-pulse" style={{ animationDelay: '0.5s' }}>Content</span>{" "}
                <br className="md:hidden" />
                <span className="relative inline-block animate-pulse" style={{ animationDelay: '1s' }}>That</span>{" "}
                <span className="relative inline-block animate-pulse" style={{ animationDelay: '1.5s' }}>Converts</span>
              </h2>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '2s' }}>
                Create, plan, and schedule stunning content with AI-powered tools. 
                Connect your ideas visually and watch your content strategy come to life.
              </p>
              
              <div className="flex gap-6 justify-center flex-wrap animate-fade-in" style={{ animationDelay: '2.5s' }}>
                <Button 
                  size="lg"
                  onClick={() => setShowLogin(true)}
                  className="bg-gradient-primary hover:opacity-90 glow-hover text-lg px-10 py-5 h-auto relative overflow-hidden group transform hover:scale-105 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center">
                    Start Creating
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-primary/20 hover:border-primary/40 text-lg px-10 py-5 h-auto relative overflow-hidden group backdrop-blur-sm hover:scale-105 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </span>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>
            </div>
          </section>

          {/* Feature highlights */}
          <section className="mb-24">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className="p-6 bg-card/40 backdrop-blur-sm border-border/30 hover:border-primary/50 transition-all duration-500 group relative overflow-hidden transform hover:-translate-y-1"
                    style={{ animationDelay: `${3 + index * 0.2}s` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 text-center">
                      <div className="relative mb-4 mx-auto w-12 h-12">
                        <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center relative overflow-hidden">
                          <Icon className="w-6 h-6 text-white group-hover:animate-pulse" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-sweep"></div>
                        </div>
                        <div className="absolute -inset-1 bg-gradient-primary rounded-lg opacity-30 blur animate-pulse"></div>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Visual Planning Preview Section */}
          <section className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Visual Planning Preview
              </h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect your content ideas with our intuitive node-based planning system. 
                Visualize your content strategy and see how everything connects.
              </p>
            </div>

            <Card className="p-8 bg-card/40 backdrop-blur-sm border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xl font-semibold">Content Network</h4>
                  <Button variant="outline" className="border-primary/20 hover:border-primary/40">
                    <Play className="w-4 h-4 mr-2" />
                    Try Interactive Demo
                  </Button>
                </div>

                {/* Large Node Canvas Preview */}
                <div className="relative h-80 bg-background/20 rounded-lg p-6 overflow-hidden mb-6">
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    <line
                      x1="150" y1="100" x2="350" y2="150"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                    <line
                      x1="150" y1="100" x2="200" y2="250"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2" 
                      strokeDasharray="4,4"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                    <line
                      x1="350" y1="150" x2="500" y2="200"
                      stroke="hsl(var(--accent))"
                      strokeWidth="2" 
                      strokeDasharray="4,4"
                      opacity="0.6"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Sample Nodes */}
                  {sampleNodes.map((node, index) => {
                    const TypeIcon = node.type === 'post' ? Target : node.type === 'image' ? Eye : Zap;
                    const statusColor = node.status === 'published' ? 'bg-green-500' : 
                                       node.status === 'scheduled' ? 'bg-gradient-primary' : 'bg-muted';
                    
                    const positions = [
                      { x: 120, y: 70 },
                      { x: 320, y: 120 },
                      { x: 170, y: 220 },
                    ];
                    
                    return (
                      <div
                        key={node.id}
                        className="absolute bg-card/90 border border-border/50 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer group transform hover:scale-105"
                        style={{
                          left: `${positions[index].x}px`,
                          top: `${positions[index].y}px`,
                          width: '180px'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 ${statusColor} rounded-lg flex items-center justify-center shadow-md`}>
                            <TypeIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold truncate">{node.title}</h5>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                          {node.content}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs h-5 px-2 ${
                            node.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            node.status === 'scheduled' ? 'bg-primary/20 text-primary' :
                            'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {node.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/50 text-center">
                    <div className="text-2xl font-bold text-primary mb-1">3</div>
                    <div className="text-sm text-muted-foreground">Active Nodes</div>
                  </Card>
                  <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/50 text-center">
                    <div className="text-2xl font-bold text-accent mb-1">2</div>
                    <div className="text-sm text-muted-foreground">Connections</div>
                  </Card>
                  <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/50 text-center">
                    <div className="text-2xl font-bold text-green-500 mb-1">1</div>
                    <div className="text-sm text-muted-foreground">Published</div>
                  </Card>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-xl border-border/50 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-lg"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-sweep"></div>
                </div>
                <h3 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">Welcome to BrewPost</h3>
                <p className="text-muted-foreground">Sign in to start creating amazing content</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1 border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1 border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLogin(false)}
                    className="flex-1 border-border/50 hover:border-border"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-gradient-primary hover:opacity-90 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Landing;