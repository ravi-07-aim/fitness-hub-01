import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';
import FeatureCard from '@/components/FeatureCard';

const Sports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center">
        <div className="text-primary text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background text-foreground overflow-x-hidden">
      <FloatingParticles />
      <Navbar showBack backLabel="Back to Home" backPath="/" />

      <header className="text-center pt-32 pb-12 px-8 bg-primary/10 border-b-[3px] border-primary mt-[70px]">
        <h1 className="text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_20px_hsla(0,100%,50%,0.6)] mb-4 tracking-wider animate-slideUp">
          ⚽ Sports Guide
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          Learn rules, warm-ups, and drills for various sports.
        </p>
      </header>

      <section className="max-w-[900px] mx-auto py-12 px-4 md:px-8 pb-16">
        <h2 className="text-3xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)] mb-2">
          Choose a Sport
        </h2>
        <p className="text-muted-foreground mb-8">
          Select a sport to explore rules, warm-up routines, and training drills.
        </p>

        <div className="flex flex-col gap-5">
          <FeatureCard
            icon="🏏"
            title="Cricket"
            description="Learn cricket rules, batting and bowling techniques, warm-up exercises, and match strategies."
            buttonText="Explore Cricket"
            onClick={() => navigate('/sports/cricket')}
            iconColor="text-fitness-red"
          />

          <FeatureCard
            icon="⚽"
            title="Football"
            description="Master football fundamentals including passing, shooting, defensive tactics, and team formations."
            buttonText="Explore Football"
            onClick={() => navigate('/sports/football')}
            iconColor="text-fitness-red-glow"
          />

          <FeatureCard
            icon="🏐"
            title="Volleyball"
            description="Discover volleyball techniques for serving, spiking, blocking, and team coordination."
            buttonText="Explore Volleyball"
            onClick={() => navigate('/sports/volleyball')}
            iconColor="text-orange-400"
          />

          <FeatureCard
            icon="🤼"
            title="Kabaddi"
            description="Explore kabaddi raiding techniques, defensive formations, and match strategies."
            buttonText="Explore Kabaddi"
            onClick={() => navigate('/sports/kabaddi')}
            iconColor="text-fitness-red"
          />

          <FeatureCard
            icon="🏃"
            title="Athletics"
            description="Training tips for track and field events including sprints, jumps, throws, and endurance races."
            buttonText="Explore Athletics"
            onClick={() => navigate('/sports/athletics')}
            iconColor="text-fitness-red-glow"
          />
        </div>
      </section>
    </div>
  );
};

export default Sports;
