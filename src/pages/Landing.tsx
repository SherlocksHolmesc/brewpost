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
          <section className="text-center mb-32">
            <div className="relative max-w-6xl mx-auto">
              {/* Enhanced floating elements around hero */}
              <div className="absolute -top-20 -left-20 w-32 h-32 bg-gradient-primary rounded-full opacity-15 animate-float blur-xl"></div>
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-accent rounded-full opacity-25 animate-float-delayed blur-lg"></div>
              <div className="absolute top-32 left-10 w-16 h-16 bg-gradient-primary rounded-full opacity-20 animate-float blur-md"></div>
              <div className="absolute top-40 -right-5 w-20 h-20 bg-gradient-accent rounded-full opacity-15 animate-float-delayed blur-lg"></div>
              
              {/* Main heading with enhanced glow */}
              <div className="relative">
                <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent leading-tight relative">
                  <span className="relative inline-block animate-pulse drop-shadow-2xl">
                    Brew
                    <div className="absolute inset-0 bg-gradient-primary opacity-30 blur-xl animate-pulse"></div>
                  </span>{" "}
                  <span className="relative inline-block animate-pulse drop-shadow-2xl" style={{ animationDelay: '0.5s' }}>
                    Content
                    <div className="absolute inset-0 bg-gradient-primary opacity-30 blur-xl animate-pulse"></div>
                  </span>{" "}
                  <br />
                  <span className="relative inline-block animate-pulse drop-shadow-2xl" style={{ animationDelay: '1s' }}>
                    That
                    <div className="absolute inset-0 bg-gradient-accent opacity-30 blur-xl animate-pulse"></div>
                  </span>{" "}
                  <span className="relative inline-block animate-pulse drop-shadow-2xl" style={{ animationDelay: '1.5s' }}>
                    Converts
                    <div className="absolute inset-0 bg-gradient-accent opacity-30 blur-xl animate-pulse"></div>
                  </span>
                </h2>
                
                {/* Glow effect behind text */}
                <div className="absolute inset-0 bg-gradient-primary opacity-10 blur-3xl animate-pulse"></div>
              </div>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto animate-fade-in relative" style={{ animationDelay: '2s' }}>
                Create, plan, and schedule stunning content with AI-powered tools. 
                Connect your ideas visually and watch your content strategy come to life with intelligent automation.
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 blur-2xl opacity-50"></div>
              </p>
              
              <div className="flex gap-8 justify-center flex-wrap animate-fade-in mb-16" style={{ animationDelay: '2.5s' }}>
                <Button 
                  size="lg"
                  onClick={() => setShowLogin(true)}
                  className="bg-gradient-primary hover:opacity-90 text-lg px-12 py-6 h-auto relative overflow-hidden group transform hover:scale-110 transition-all duration-300 shadow-2xl"
                  style={{
                    boxShadow: '0 0 40px hsl(var(--primary) / 0.6), 0 0 80px hsl(var(--primary) / 0.3)'
                  }}
                >
                  <span className="relative z-10 flex items-center font-semibold">
                    Start Creating
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="absolute -inset-1 bg-gradient-primary opacity-50 blur animate-pulse"></div>
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-primary/30 hover:border-primary/60 text-lg px-12 py-6 h-auto relative overflow-hidden group backdrop-blur-sm hover:scale-110 transition-all duration-300 shadow-xl"
                  style={{
                    boxShadow: '0 0 20px hsl(var(--primary) / 0.2)'
                  }}
                >
                  <span className="relative z-10 flex items-center font-semibold">
                    <Play className="w-5 h-5 mr-2" />
                    Watch Demo
                  </span>
                  <div className="absolute inset-0 bg-gradient-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-primary opacity-20 blur group-hover:opacity-40 transition-opacity duration-300"></div>
                </Button>
              </div>

              {/* Enhanced floating showcase elements */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto opacity-60">
                <div className="flex items-center gap-3 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-primary/20 animate-float hover:scale-105 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">AI Powered</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-accent/20 animate-float hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                  <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center shadow-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Visual Planning</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-primary/20 animate-float hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.4s' }}>
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Smart Schedule</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card/20 backdrop-blur-sm rounded-xl border border-accent/20 animate-float hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.6s' }}>
                  <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Auto Publish</span>
                </div>
              </div>
            </div>
          </section>

          {/* Feature highlights */}
          <section className="mb-32">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className="p-8 bg-card/30 backdrop-blur-md border-border/20 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden transform hover:-translate-y-2 hover:scale-105"
                    style={{ 
                      animationDelay: `${3 + index * 0.3}s`,
                      boxShadow: '0 0 30px hsl(var(--primary) / 0.1)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/5 to-primary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-1 bg-gradient-primary opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 text-center">
                      <div className="relative mb-6 mx-auto w-16 h-16">
                        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-8 h-8 text-white group-hover:animate-pulse" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep"></div>
                        </div>
                        <div className="absolute -inset-2 bg-gradient-primary rounded-2xl opacity-30 blur-lg animate-pulse group-hover:opacity-60 transition-opacity duration-300"></div>
                        <div className="absolute -inset-4 bg-gradient-primary rounded-2xl opacity-10 blur-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors relative">
                        {feature.title}
                        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300"></div>
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {feature.description}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Visual Planning Preview Section */}
          <section className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="relative">
                <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent relative">
                  Visual Planning Preview
                  <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-2xl animate-pulse"></div>
                </h3>
                <div className="absolute -inset-4 bg-gradient-primary opacity-10 blur-3xl animate-pulse"></div>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Experience the power of visual content planning. Watch your ideas connect and flow in real-time.
              </p>
            </div>

            <Card className="p-12 bg-card/20 backdrop-blur-xl border border-primary/20 relative overflow-hidden shadow-2xl"
                  style={{ boxShadow: '0 0 60px hsl(var(--primary) / 0.3)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10"></div>
              <div className="absolute -inset-1 bg-gradient-primary opacity-20 blur-2xl animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  <h4 className="text-2xl font-bold text-foreground relative">
                    Content Network
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-primary opacity-60"></div>
                  </h4>
                  <Button variant="outline" className="border-primary/30 hover:border-primary/60 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                          style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.2)' }}>
                    <Play className="w-4 h-4 mr-2" />
                    Try Interactive Demo
                  </Button>
                </div>

                {/* Enhanced Node Canvas Preview */}
                <div className="relative h-[500px] bg-gradient-to-br from-background/40 via-primary/5 to-background/40 rounded-2xl p-8 overflow-hidden backdrop-blur-sm border border-primary/10">
                  {/* Glowing Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    <defs>
                      <linearGradient id="glowGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1"/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                      </linearGradient>
                      <linearGradient id="glowGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1"/>
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8"/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Glowing rope-like connections */}
                    <path
                      d="M 180 150 Q 280 120, 380 180"
                      stroke="url(#glowGradient1)"
                      strokeWidth="4"
                      fill="none"
                      filter="url(#glow)"
                      className="animate-pulse"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 180 150 Q 200 200, 240 280"
                      stroke="url(#glowGradient2)"
                      strokeWidth="4"
                      fill="none"
                      filter="url(#glow)"
                      className="animate-pulse"
                      strokeLinecap="round"
                      style={{ animationDelay: '0.5s' }}
                    />
                    <path
                      d="M 380 180 Q 420 220, 460 260"
                      stroke="url(#glowGradient1)"
                      strokeWidth="4"
                      fill="none"
                      filter="url(#glow)"
                      className="animate-pulse"
                      strokeLinecap="round"
                      style={{ animationDelay: '1s' }}
                    />
                  </svg>

                  {/* Enhanced Glowing Nodes */}
                  {sampleNodes.map((node, index) => {
                    const TypeIcon = node.type === 'post' ? Target : node.type === 'image' ? Eye : Zap;
                    const statusColors = {
                      published: { bg: 'bg-green-500', glow: '#10b981', shadow: 'shadow-green-500/50' },
                      scheduled: { bg: 'bg-gradient-primary', glow: 'hsl(var(--primary))', shadow: 'shadow-primary/50' },
                      draft: { bg: 'bg-gradient-accent', glow: 'hsl(var(--accent))', shadow: 'shadow-accent/50' }
                    };
                    const colors = statusColors[node.status];
                    
                    const positions = [
                      { x: 150, y: 120 },
                      { x: 350, y: 150 },
                      { x: 210, y: 250 },
                    ];
                    
                    return (
                      <div
                        key={node.id}
                        className="absolute bg-card/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all cursor-pointer group transform hover:scale-110 hover:-translate-y-2"
                        style={{
                          left: `${positions[index].x}px`,
                          top: `${positions[index].y}px`,
                          width: '220px',
                          boxShadow: `0 0 40px ${colors.glow}40, 0 10px 30px rgba(0,0,0,0.3)`
                        }}
                      >
                        {/* Multiple glowing layers */}
                        <div className="absolute -inset-1 bg-gradient-primary opacity-30 blur-lg rounded-2xl animate-pulse group-hover:opacity-60 transition-opacity duration-300"></div>
                        <div className="absolute -inset-2 bg-gradient-primary opacity-10 blur-xl rounded-2xl group-hover:opacity-30 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shadow-xl relative overflow-hidden group-hover:scale-110 transition-transform duration-300`}
                                 style={{ boxShadow: `0 0 20px ${colors.glow}60` }}>
                              <TypeIcon className="w-6 h-6 text-white" />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-sweep"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-lg font-bold truncate text-foreground group-hover:text-primary transition-colors">{node.title}</h5>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                            {node.content}
                          </p>
                          <Badge 
                            variant="secondary" 
                            className={`text-sm h-6 px-3 font-medium ${
                              node.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              node.status === 'scheduled' ? 'bg-primary/20 text-primary border border-primary/30' :
                              'bg-accent/20 text-accent border border-accent/30'
                            }`}
                            style={{
                              boxShadow: node.status === 'published' ? '0 0 10px #10b98140' :
                                        node.status === 'scheduled' ? '0 0 10px hsl(var(--primary) / 0.3)' :
                                        '0 0 10px hsl(var(--accent) / 0.3)'
                            }}
                          >
                            {node.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
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