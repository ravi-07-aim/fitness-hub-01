import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';
import FeatureCard from '@/components/FeatureCard';

const Home = () => {
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
      <Navbar userEmail={user?.email} />

      <header className="text-center pt-32 pb-12 px-8 bg-primary/10 border-b-[3px] border-primary mt-[70px]">
        <h1 className="text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_20px_hsla(0,100%,50%,0.6)] mb-4 tracking-wider animate-slideUp">
          Fitness Hub Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          Monitor your key health metrics, access smart calculators, and explore upcoming fitness tools in one place.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <button 
            className="rounded-full px-8 py-3 font-semibold tracking-wide uppercase text-sm border-2 border-primary/60 bg-transparent text-fitness-red-glow hover:bg-primary/10 transition-all cursor-default"
            disabled
          >
            More modules coming soon
          </button>
        </div>
      </header>

      <section className="max-w-[900px] mx-auto py-12 px-4 md:px-8 pb-16">
        <h2 className="text-3xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)] mb-2">
          Quick Access
        </h2>
        <p className="text-muted-foreground mb-8">
          Jump directly into the main tools of Fitness Hub.
        </p>

        <div className="flex flex-col gap-5">
          <FeatureCard
            icon="🏋️"
            title="BMI Calculator"
            description="Calculate your Body Mass Index and track your health metrics over time. Get personalized recommendations based on your results."
            buttonText="Open Calculator"
            onClick={() => navigate('/bmi')}
            iconColor="text-fitness-red"
          />

          <FeatureCard
            icon="🤖"
            title="FitBot - AI Coach"
            description="Get personalized fitness, health, and sports advice from our AI-powered coach. Ask anything about workouts, nutrition, or training tips."
            buttonText="Chat Now"
            onClick={() => navigate('/chatbot')}
            iconColor="text-fitness-red-glow"
          />

          <FeatureCard
            icon="⚽"
            title="Sports Challenges"
            description="Time-based challenges with stopwatch or learn proper technique for various sports activities."
            buttonText="Coming Soon"
            onClick={() => {}}
            iconColor="text-orange-400"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
