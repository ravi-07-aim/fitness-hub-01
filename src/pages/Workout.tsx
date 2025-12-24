import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';
import FeatureCard from '@/components/FeatureCard';

const Workout = () => {
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
          💪 Workout Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          Choose your workout plan and level to get started on your fitness journey.
        </p>
      </header>

      <section className="max-w-[900px] mx-auto py-12 px-4 md:px-8 pb-16">
        <h2 className="text-3xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)] mb-2">
          Workout Plans
        </h2>
        <p className="text-muted-foreground mb-8">
          Select a workout plan to view exercises for your level.
        </p>

        <div className="flex flex-col gap-5">
          <FeatureCard
            icon="🏃"
            title="Full Body Plan"
            description="Complete workout targeting all major muscle groups. Perfect for overall fitness and balanced strength development."
            buttonText="Select Level"
            onClick={() => navigate('/workout/full-body')}
            iconColor="text-fitness-red"
          />

          <FeatureCard
            icon="💪"
            title="Upper Body Plan"
            description="Focus on chest, back, shoulders, and arms. Build upper body strength and definition with targeted exercises."
            buttonText="Select Level"
            onClick={() => navigate('/workout/upper-body')}
            iconColor="text-fitness-red-glow"
          />

          <FeatureCard
            icon="🦵"
            title="Lower Body Plan"
            description="Target legs, glutes, and core. Develop lower body power and stability for athletic performance."
            buttonText="Select Level"
            onClick={() => navigate('/workout/lower-body')}
            iconColor="text-orange-400"
          />

          <FeatureCard
            icon="📖"
            title="Exercise Guides"
            description="Detailed guides for proper form and technique. Learn how to perform each exercise safely and effectively."
            buttonText="View Guides"
            onClick={() => navigate('/workout/guides')}
            iconColor="text-fitness-red"
          />
        </div>
      </section>
    </div>
  );
};

export default Workout;
