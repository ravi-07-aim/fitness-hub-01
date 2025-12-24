import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FloatingParticles from '@/components/FloatingParticles';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const togglePassword = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = registerSchema.safeParse({ username, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
    } else {
      toast.success('Account created successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center text-foreground overflow-hidden">
      <FloatingParticles />
      
      <div className="bg-background/90 p-8 rounded-2xl shadow-[0_20px_40px_hsla(0,100%,50%,0.3)] border-2 border-primary w-full max-w-md backdrop-blur-lg animate-slideUp relative z-10 mx-4">
        <div className="text-center mb-8">
          <h2 className="text-primary text-3xl font-bold drop-shadow-[0_0_10px_hsla(0,100%,50%,0.5)]">
            {isLogin ? 'Login' : 'Register'}
          </h2>
        </div>

        <div className="flex bg-primary/20 rounded-full p-1 mb-8">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              isLogin 
                ? 'bg-primary text-primary-foreground shadow-glow-red' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-full font-medium transition-all ${
              !isLogin 
                ? 'bg-primary text-primary-foreground shadow-glow-red' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block mb-2 text-primary font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
                required
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <label className="block mb-2 text-primary font-medium">Password</label>
              <input
                type={showPassword.login ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
                required
              />
              <span 
                onClick={() => togglePassword('login')}
                className="absolute right-4 top-11 cursor-pointer text-primary text-xl hover:scale-110 transition-transform"
              >
                {showPassword.login ? '🔓' : '⚡'}
              </span>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-fitness-red-dark text-primary-foreground rounded-lg font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-glow-red-intense disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block mb-2 text-primary font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johnfit"
                className="w-full px-4 py-3 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
                required
              />
              {errors.username && <p className="text-destructive text-sm mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block mb-2 text-primary font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
                required
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <label className="block mb-2 text-primary font-medium">Password</label>
              <input
                type={showPassword.register ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 pr-12 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
                required
              />
              <span 
                onClick={() => togglePassword('register')}
                className="absolute right-4 top-11 cursor-pointer text-primary text-xl hover:scale-110 transition-transform"
              >
                {showPassword.register ? '🔓' : '⚡'}
              </span>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="relative">
              <label className="block mb-2 text-primary font-medium">Confirm Password</label>
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 pr-12 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
                required
              />
              <span 
                onClick={() => togglePassword('confirm')}
                className="absolute right-4 top-11 cursor-pointer text-primary text-xl hover:scale-110 transition-transform"
              >
                {showPassword.confirm ? '🔓' : '⚡'}
              </span>
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-fitness-red-dark text-primary-foreground rounded-lg font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-glow-red-intense disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
