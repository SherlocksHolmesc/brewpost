import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, Target, Calendar, ArrowRight } from 'lucide-react';
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
              background: `hsl(${191 + Math.random() * 20}, ${60 + Math.random() * 20}%, ${40 + Math.random() * 20}%)`,
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
              background: `linear-gradient(135deg, hsl(${191 + Math.random() * 15}, 60%, 45%), hsl(${191 + Math.random() * 15}, 70%, 35%))`,
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
              background: `radial-gradient(circle, hsl(191, 70%, 50%), transparent)`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
              filter: 'blur(2px)',
              boxShadow: `0 0 ${10 + Math.random() * 20}px hsl(191, 60%, 40%)`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-conic from-primary/15 via-accent/8 to-primary/15 animate-pulse"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/25 to-accent/25 rounded-full blur-3xl animate-float opacity-60"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-accent/25 to-primary/25 rounded-full blur-3xl animate-float-delayed opacity-60"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-transparent via-primary/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" 
             style={{ 
               backgroundImage: `
                 linear-gradient(90deg, transparent 98%, hsl(var(--primary)) 100%),
                 linear-gradient(0deg, transparent 98%, hsl(var(--primary)) 100%)
               `,
               backgroundSize: '50px 50px'
             }}>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/20 bg-card/40 backdrop-blur-xl relative">
          {/* Header glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
          
          <div className="container mx-auto px-6 py-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center relative overflow-hidden">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-sweep"></div>
                </div>
                <div className="absolute -inset-1 bg-gradient-primary rounded-xl opacity-30 blur animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-pulse">
                  BrewPost
                </h1>
                <p className="text-xs text-muted-foreground">AI Content Generator</p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowLogin(true)}
              className="bg-gradient-primary hover:opacity-90 glow-hover relative overflow-hidden group"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center relative">
          <div className="max-w-4xl mx-auto relative">
            {/* Floating elements around hero */}
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-primary rounded-full opacity-20 animate-float blur"></div>
            <div className="absolute -top-5 -right-5 w-12 h-12 bg-gradient-accent rounded-full opacity-30 animate-float-delayed blur"></div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight relative">
              <span className="relative inline-block animate-pulse">Brew</span>{" "}
              <span className="relative inline-block animate-pulse" style={{ animationDelay: '0.5s' }}>Content</span>{" "}
              <span className="relative inline-block animate-pulse" style={{ animationDelay: '1s' }}>That</span>{" "}
              <span className="relative inline-block animate-pulse" style={{ animationDelay: '1.5s' }}>Converts</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '2s' }}>
              Create, plan, and schedule stunning content with AI-powered tools. 
              Connect your ideas visually and watch your content strategy come to life.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap animate-fade-in" style={{ animationDelay: '2.5s' }}>
              <Button 
                size="lg"
                onClick={() => setShowLogin(true)}
                className="bg-gradient-primary hover:opacity-90 glow-hover text-lg px-8 py-4 h-auto relative overflow-hidden group transform hover:scale-105 transition-all duration-300"
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
                className="border-primary/20 hover:border-primary/40 text-lg px-8 py-4 h-auto relative overflow-hidden group backdrop-blur-sm hover:scale-105 transition-all duration-300"
              >
                <span className="relative z-10">Watch Demo</span>
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-20 relative">
          <div className="text-center mb-16 relative">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-primary rounded-full opacity-50"></div>
            <h3 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">Everything You Need</h3>
            <p className="text-lg text-muted-foreground">Powerful tools to transform your content creation workflow</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="p-8 bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-500 glow-hover group relative overflow-hidden transform hover:-translate-y-2"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {/* Card glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center relative overflow-hidden">
                        <Icon className="w-8 h-8 text-white group-hover:animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </div>
                      <div className="absolute -inset-1 bg-gradient-primary rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500"></div>
                    </div>
                    
                    <h4 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">{feature.title}</h4>
                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">{feature.description}</p>
                  </div>
                  
                  {/* Floating particles inside card */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 animate-float transition-opacity duration-500"></div>
                  <div className="absolute bottom-4 left-4 w-1 h-1 bg-accent/40 rounded-full opacity-0 group-hover:opacity-100 animate-float-delayed transition-opacity duration-500"></div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-xl border-border/50">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Welcome to BrewPost</h3>
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
                    className="mt-1"
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
                    className="mt-1"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLogin(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-gradient-primary hover:opacity-90"
                  >
                    Sign In
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;