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

type AuthMode = 'login' | 'register' | 'forgot' | 'verify-otp';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // OTP fields
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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

  const sendOTP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, action: 'send' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Verification code sent to your email!');
        setOtpSent(true);
        setResendTimer(60);
        setMode('verify-otp');
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setErrors({ otp: 'Please enter a 6-digit code' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email, action: 'verify', otp }
      });

      if (error) throw error;

      if (data.success) {
        // Email verified, now complete registration
        await completeRegistration();
      } else {
        setErrors({ otp: data.message || 'Invalid verification code' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const completeRegistration = async () => {
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
        setMode('login');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created successfully!');
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

    // Send OTP for email verification
    await sendOTP();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email || !z.string().email().safeParse(email).success) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent! Check your email.');
      setMode('login');
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Login';
      case 'register': return 'Register';
      case 'forgot': return 'Reset Password';
      case 'verify-otp': return 'Verify Email';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center text-foreground overflow-hidden">
      <FloatingParticles />
      
      <div className="bg-background/90 p-8 rounded-2xl shadow-[0_20px_40px_hsla(0,100%,50%,0.3)] border-2 border-primary w-full max-w-md backdrop-blur-lg animate-slideUp relative z-10 mx-4">
        <div className="text-center mb-8">
          <h2 className="text-primary text-3xl font-bold drop-shadow-[0_0_10px_hsla(0,100%,50%,0.5)]">
            {getTitle()}
          </h2>
        </div>

        {mode !== 'forgot' && mode !== 'verify-otp' && (
          <div className="flex bg-primary/20 rounded-full p-1 mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-full font-medium transition-all ${
                mode === 'login' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 rounded-full font-medium transition-all ${
                mode === 'register' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {mode === 'login' && (
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
              type="button"
              onClick={() => setMode('forgot')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_18px_hsla(0,100%,50%,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {mode === 'register' && (
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
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_18px_hsla(0,100%,50%,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending verification...' : 'Register'}
            </button>
          </form>
        )}

        {mode === 'verify-otp' && (
          <div className="space-y-6">
            <p className="text-muted-foreground text-center">
              We've sent a 6-digit verification code to <span className="text-primary font-medium">{email}</span>
            </p>
            
            <div>
              <label className="block mb-2 text-primary font-medium text-center">Enter Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  setErrors({});
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-4 bg-foreground/10 border-2 border-primary/30 rounded-lg text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-foreground/30 focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsla(0,100%,50%,0.3)] transition-all"
              />
              {errors.otp && <p className="text-destructive text-sm mt-2 text-center">{errors.otp}</p>}
            </div>

            <button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_18px_hsla(0,100%,50%,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the code? Resend"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setOtp('');
                setOtpSent(false);
              }}
              className="w-full text-center text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Register
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <p className="text-muted-foreground text-center mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_18px_hsla(0,100%,50%,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
