import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';

type Level = 'beginner' | 'intermediate' | 'advanced';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  imageSlot: string; // Placeholder for where to add images
}

interface WorkoutData {
  title: string;
  icon: string;
  levels: Record<Level, Exercise[]>;
}

const workoutPlans: Record<string, WorkoutData> = {
  'full-body': {
    title: 'Full Body Plan',
    icon: '🏃',
    levels: {
      beginner: [
        { name: 'Jumping Jacks', sets: '3', reps: '20', rest: '30s', imageSlot: 'jumping-jacks.jpg' },
        { name: 'Bodyweight Squats', sets: '3', reps: '12', rest: '45s', imageSlot: 'squats.jpg' },
        { name: 'Push-ups (Knee)', sets: '3', reps: '10', rest: '45s', imageSlot: 'knee-pushups.jpg' },
        { name: 'Lunges', sets: '2', reps: '10 each', rest: '45s', imageSlot: 'lunges.jpg' },
        { name: 'Plank', sets: '3', reps: '20s', rest: '30s', imageSlot: 'plank.jpg' },
      ],
      intermediate: [
        { name: 'Burpees', sets: '3', reps: '10', rest: '45s', imageSlot: 'burpees.jpg' },
        { name: 'Jump Squats', sets: '4', reps: '15', rest: '45s', imageSlot: 'jump-squats.jpg' },
        { name: 'Push-ups', sets: '4', reps: '15', rest: '45s', imageSlot: 'pushups.jpg' },
        { name: 'Walking Lunges', sets: '3', reps: '12 each', rest: '45s', imageSlot: 'walking-lunges.jpg' },
        { name: 'Mountain Climbers', sets: '3', reps: '30s', rest: '30s', imageSlot: 'mountain-climbers.jpg' },
        { name: 'Plank', sets: '3', reps: '45s', rest: '30s', imageSlot: 'plank.jpg' },
      ],
      advanced: [
        { name: 'Burpee Box Jumps', sets: '4', reps: '12', rest: '60s', imageSlot: 'burpee-box-jumps.jpg' },
        { name: 'Pistol Squats', sets: '3', reps: '8 each', rest: '60s', imageSlot: 'pistol-squats.jpg' },
        { name: 'Diamond Push-ups', sets: '4', reps: '15', rest: '45s', imageSlot: 'diamond-pushups.jpg' },
        { name: 'Jump Lunges', sets: '4', reps: '12 each', rest: '45s', imageSlot: 'jump-lunges.jpg' },
        { name: 'Plank to Push-up', sets: '3', reps: '12', rest: '45s', imageSlot: 'plank-pushup.jpg' },
        { name: 'V-Ups', sets: '4', reps: '15', rest: '30s', imageSlot: 'v-ups.jpg' },
      ],
    },
  },
  'upper-body': {
    title: 'Upper Body Plan',
    icon: '💪',
    levels: {
      beginner: [
        { name: 'Wall Push-ups', sets: '3', reps: '12', rest: '30s', imageSlot: 'wall-pushups.jpg' },
        { name: 'Arm Circles', sets: '3', reps: '30s each', rest: '20s', imageSlot: 'arm-circles.jpg' },
        { name: 'Incline Push-ups', sets: '3', reps: '10', rest: '45s', imageSlot: 'incline-pushups.jpg' },
        { name: 'Tricep Dips (Chair)', sets: '3', reps: '10', rest: '45s', imageSlot: 'chair-dips.jpg' },
        { name: 'Shoulder Taps', sets: '3', reps: '20', rest: '30s', imageSlot: 'shoulder-taps.jpg' },
      ],
      intermediate: [
        { name: 'Push-ups', sets: '4', reps: '15', rest: '45s', imageSlot: 'pushups.jpg' },
        { name: 'Pike Push-ups', sets: '3', reps: '12', rest: '45s', imageSlot: 'pike-pushups.jpg' },
        { name: 'Tricep Dips', sets: '4', reps: '12', rest: '45s', imageSlot: 'tricep-dips.jpg' },
        { name: 'Diamond Push-ups', sets: '3', reps: '10', rest: '45s', imageSlot: 'diamond-pushups.jpg' },
        { name: 'Superman Hold', sets: '3', reps: '30s', rest: '30s', imageSlot: 'superman.jpg' },
      ],
      advanced: [
        { name: 'Archer Push-ups', sets: '4', reps: '8 each', rest: '60s', imageSlot: 'archer-pushups.jpg' },
        { name: 'Handstand Push-ups (Wall)', sets: '3', reps: '8', rest: '60s', imageSlot: 'handstand-pushups.jpg' },
        { name: 'Explosive Push-ups', sets: '4', reps: '12', rest: '45s', imageSlot: 'explosive-pushups.jpg' },
        { name: 'Typewriter Push-ups', sets: '3', reps: '6 each', rest: '60s', imageSlot: 'typewriter-pushups.jpg' },
        { name: 'Decline Diamond Push-ups', sets: '4', reps: '12', rest: '45s', imageSlot: 'decline-diamond-pushups.jpg' },
      ],
    },
  },
  'lower-body': {
    title: 'Lower Body Plan',
    icon: '🦵',
    levels: {
      beginner: [
        { name: 'Bodyweight Squats', sets: '3', reps: '15', rest: '45s', imageSlot: 'squats.jpg' },
        { name: 'Glute Bridges', sets: '3', reps: '12', rest: '30s', imageSlot: 'glute-bridges.jpg' },
        { name: 'Standing Calf Raises', sets: '3', reps: '20', rest: '30s', imageSlot: 'calf-raises.jpg' },
        { name: 'Lunges', sets: '2', reps: '10 each', rest: '45s', imageSlot: 'lunges.jpg' },
        { name: 'Wall Sit', sets: '3', reps: '30s', rest: '30s', imageSlot: 'wall-sit.jpg' },
      ],
      intermediate: [
        { name: 'Jump Squats', sets: '4', reps: '15', rest: '45s', imageSlot: 'jump-squats.jpg' },
        { name: 'Romanian Deadlift (Single Leg)', sets: '3', reps: '10 each', rest: '45s', imageSlot: 'single-leg-rdl.jpg' },
        { name: 'Sumo Squats', sets: '4', reps: '15', rest: '45s', imageSlot: 'sumo-squats.jpg' },
        { name: 'Hip Thrusts', sets: '3', reps: '15', rest: '45s', imageSlot: 'hip-thrusts.jpg' },
        { name: 'Reverse Lunges', sets: '3', reps: '12 each', rest: '45s', imageSlot: 'reverse-lunges.jpg' },
      ],
      advanced: [
        { name: 'Pistol Squats', sets: '4', reps: '8 each', rest: '60s', imageSlot: 'pistol-squats.jpg' },
        { name: 'Box Jumps', sets: '4', reps: '12', rest: '60s', imageSlot: 'box-jumps.jpg' },
        { name: 'Bulgarian Split Squats', sets: '3', reps: '12 each', rest: '60s', imageSlot: 'bulgarian-split-squats.jpg' },
        { name: 'Single Leg Hip Thrust', sets: '3', reps: '10 each', rest: '45s', imageSlot: 'single-leg-hip-thrust.jpg' },
        { name: 'Squat Jumps to Lunge', sets: '4', reps: '10', rest: '60s', imageSlot: 'squat-jump-lunge.jpg' },
      ],
    },
  },
};

const WorkoutPlan = () => {
  const navigate = useNavigate();
  const { plan } = useParams<{ plan: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  const workout = plan ? workoutPlans[plan] : null;

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

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-primary text-3xl mb-4">Workout not found</h1>
          <button
            onClick={() => navigate('/workout')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold"
          >
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  const levels: Level[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background text-foreground overflow-x-hidden">
      <FloatingParticles />
      <Navbar showBack backLabel="Back to Workouts" backPath="/workout" />

      <header className="text-center pt-32 pb-12 px-8 bg-primary/10 border-b-[3px] border-primary mt-[70px]">
        <h1 className="text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_20px_hsla(0,100%,50%,0.6)] mb-4 tracking-wider animate-slideUp">
          {workout.icon} {workout.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          {selectedLevel ? `${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level Exercises` : 'Select your fitness level to see exercises'}
        </p>
      </header>

      <section className="max-w-[900px] mx-auto py-12 px-4 md:px-8 pb-16">
        {!selectedLevel ? (
          <>
            <h2 className="text-3xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)] mb-8">
              Select Your Level
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className="fitness-panel p-6 text-center transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_hsla(0,100%,50%,0.4)]"
                >
                  <div className="text-3xl mb-3">
                    {level === 'beginner' ? '🌱' : level === 'intermediate' ? '💪' : '🔥'}
                  </div>
                  <h3 className="text-xl font-semibold text-primary capitalize">{level}</h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    {level === 'beginner' && 'New to fitness? Start here!'}
                    {level === 'intermediate' && 'Ready for more challenge'}
                    {level === 'advanced' && 'Push your limits'}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)]">
                Exercises
              </h2>
              <button
                onClick={() => setSelectedLevel(null)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                ← Change Level
              </button>
            </div>

            <div className="space-y-4">
              {workout.levels[selectedLevel].map((exercise, index) => (
                <div
                  key={index}
                  className="fitness-panel p-5 flex items-center gap-4 animate-slideUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* IMAGE PLACEHOLDER - Add your exercise images here */}
                  <div className="w-20 h-20 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                    <span className="text-3xl">
                      {index % 3 === 0 ? '🏋️' : index % 3 === 1 ? '💪' : '🦵'}
                    </span>
                    {/* To add images, replace the span above with:
                    <img 
                      src={`/workout-images/${exercise.imageSlot}`} 
                      alt={exercise.name}
                      className="w-full h-full object-cover rounded-lg"
                    /> */}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-primary">{exercise.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="bg-primary/20 px-2 py-1 rounded">{exercise.sets} sets</span>
                      <span className="bg-primary/20 px-2 py-1 rounded">{exercise.reps} reps</span>
                      <span className="bg-primary/20 px-2 py-1 rounded">{exercise.rest} rest</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/workout/guides#${exercise.name.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                  >
                    Guide
                  </button>
                </div>
              ))}
            </div>

            {/* Note about adding images */}
            <div className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <h4 className="text-primary font-semibold mb-2">📷 Adding Exercise Images</h4>
              <p className="text-muted-foreground text-sm">
                To add exercise images, place them in <code className="bg-primary/20 px-1 rounded">public/workout-images/</code> folder with the following names:
              </p>
              <ul className="text-muted-foreground text-sm mt-2 list-disc list-inside">
                {workout.levels[selectedLevel].slice(0, 3).map((ex) => (
                  <li key={ex.imageSlot}>{ex.imageSlot}</li>
                ))}
                <li>...and more</li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default WorkoutPlan;
