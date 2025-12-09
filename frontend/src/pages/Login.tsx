import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { logger } from '@/lib/logger';

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

  // Clear form when switching between login and signup
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFullName('');
    setEmail('');
    setPassword('');
  };

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
        // Register - validate full name is provided
        if (!fullName.trim()) {
          toast({
            title: 'Error',
            description: 'Please enter your full name',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        await authService.register({ name: fullName, email, password });
        
        // Show success message and switch to login
        toast({
          title: 'Account created!',
          description: 'Please sign in with your credentials',
        });
        
        // Clear form and switch to login mode
        setFullName('');
        setPassword('');
        setIsLogin(true);
        setIsLoading(false);
        return;
      }
      navigate('/dashboard');
    } catch (error: any) {
      // Use logger for safe error handling - no sensitive data logged
      logger.error('Authentication failed', { isLogin });
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || 'Authentication failed';
      toast({
        title: 'Error',
        description: errorMessage,
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
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" key={isLogin ? 'login' : 'signup'}>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="signup-fullName">Full Name</Label>
                <Input
                  id="signup-fullName"
                  name="signup-fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  autoComplete="off"
                  className="rounded-xl"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor={isLogin ? "login-email" : "signup-email"}>Email</Label>
              <Input
                id={isLogin ? "login-email" : "signup-email"}
                name={isLogin ? "login-email" : "signup-email"}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={isLogin ? "login-password" : "signup-password"}>Password</Label>
              <Input
                id={isLogin ? "login-password" : "signup-password"}
                name={isLogin ? "login-password" : "signup-password"}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                className="rounded-xl"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={handleToggleMode}
              className="text-primary hover:underline"
              type="button"
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
