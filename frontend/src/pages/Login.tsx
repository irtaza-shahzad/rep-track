import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set initial state based on navigation from Welcome page
    if (location.state?.isSignUp !== undefined) {
      setIsLogin(!location.state.isSignUp);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        await authService.login({ email, password });
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in',
        });
      } else {
        // Register
        await authService.register({ full_name: fullName, email, password });
        toast({
          title: 'Account created!',
          description: 'Welcome to FitTrack',
        });
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Authentication failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-scale-in card-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary flex items-center justify-center sage-glow">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? 'Welcome Back' : 'Get Started'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to continue your fitness journey' : 'Create your account to start tracking'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
