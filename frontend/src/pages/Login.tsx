import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { logger } from '@/lib/logger';

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name may only contain letters, spaces, hyphens, apostrophes, or periods'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/\d/, 'Must contain at least one number'),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  useEffect(() => {
    if (location.state?.isSignUp !== undefined) {
      setIsLogin(!location.state.isSignUp);
    }
  }, [location]);

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    loginForm.reset();
    signupForm.reset();
  };

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await authService.login({ email: data.email, password: data.password });
      toast({ title: 'Welcome back!', description: 'Successfully signed in' });
      navigate('/dashboard');
    } catch (error: unknown) {
      logger.error('Authentication failed', { isLogin: true });
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      toast({
        title: 'Error',
        description: err.response?.data?.detail || err.response?.data?.message || err.message || 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  });

  const handleSignup = signupForm.handleSubmit(async (data) => {
    setIsLoading(true);
    try {
      await authService.register({ name: data.fullName.trim(), email: data.email, password: data.password });
      toast({ title: 'Account created!', description: 'Please sign in with your credentials' });
      signupForm.reset();
      setIsLogin(true);
    } catch (error: unknown) {
      logger.error('Authentication failed', { isLogin: false });
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
      toast({
        title: 'Error',
        description: err.response?.data?.detail || err.response?.data?.message || err.message || 'Registration failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  });

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
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="off"
                  className="rounded-xl"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="off"
                  className="rounded-xl"
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Please wait...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="signup-fullName">Full Name</Label>
                <Input
                  id="signup-fullName"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="off"
                  className="rounded-xl"
                  {...signupForm.register('fullName')}
                />
                {signupForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="off"
                  className="rounded-xl"
                  {...signupForm.register('email')}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="off"
                  className="rounded-xl"
                  {...signupForm.register('password')}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Please wait...' : 'Create Account'}
              </Button>
            </form>
          )}

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
