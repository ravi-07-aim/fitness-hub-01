import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

interface NavbarProps {
  userEmail?: string;
  showBack?: boolean;
  backLabel?: string;
  backPath?: string;
}

const Navbar = ({ userEmail, showBack = false, backLabel = 'Back to Home', backPath = '/' }: NavbarProps) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out');
      setLoggingOut(false);
    } else {
      navigate('/auth');
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-xl z-50 px-4 md:px-8 py-4 border-b-[3px] border-primary shadow-glow-red">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center">
        <div 
          className="cursor-pointer"
          onClick={() => navigate('/')}
        >
          <h2 className="text-primary text-2xl md:text-3xl font-bold drop-shadow-[0_0_10px_hsla(0,100%,50%,0.5)]">
            Fitness Hub
          </h2>
        </div>
        
        {showBack ? (
          <div 
            className="text-muted-foreground text-sm cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(backPath)}
          >
            ← <span className="text-fitness-red-glow">{backLabel}</span>
          </div>
        ) : userEmail && (
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm hidden md:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold uppercase tracking-wider transition-all ${
                loggingOut 
                  ? 'bg-muted cursor-not-allowed opacity-50' 
                  : 'hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_18px_hsla(0,100%,50%,0.4)]'
              }`}
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
