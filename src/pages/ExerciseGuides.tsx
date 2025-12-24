import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';

interface ExerciseGuide {
  name: string;
  category: string;
  description: string;
  steps: string[];
  tips: string[];
  imageSlot: string;
}

const exerciseGuides: ExerciseGuide[] = [
  {
    name: 'Push-ups',
    category: 'Upper Body',
    description: 'A classic compound exercise that works your chest, shoulders, and triceps.',
    steps: [
      'Start in a plank position with hands slightly wider than shoulder-width',
      'Keep your body in a straight line from head to heels',
      'Lower your chest towards the floor by bending your elbows',
      'Push back up to the starting position',
      'Keep your core tight throughout the movement'
    ],
    tips: [
      'Don\'t let your hips sag or pike up',
      'Keep your elbows at about 45 degrees to your body',
      'Breathe in on the way down, out on the way up'
    ],
    imageSlot: 'pushups-guide.jpg'
  },
  {
    name: 'Squats',
    category: 'Lower Body',
    description: 'The king of leg exercises, targeting quads, glutes, and hamstrings.',
    steps: [
      'Stand with feet shoulder-width apart, toes slightly pointed out',
      'Keep your chest up and core engaged',
      'Push your hips back and bend your knees',
      'Lower until thighs are parallel to the ground or below',
      'Drive through your heels to stand back up'
    ],
    tips: [
      'Keep your knees tracking over your toes',
      'Don\'t let your knees cave inward',
      'Maintain a neutral spine throughout'
    ],
    imageSlot: 'squats-guide.jpg'
  },
  {
    name: 'Plank',
    category: 'Core',
    description: 'An isometric exercise that strengthens the entire core and improves stability.',
    steps: [
      'Start in a forearm plank position, elbows under shoulders',
      'Keep your body in a straight line from head to heels',
      'Engage your core by pulling your belly button toward your spine',
      'Keep your glutes squeezed and legs straight',
      'Hold the position for the prescribed time'
    ],
    tips: [
      'Don\'t hold your breath - breathe normally',
      'If your lower back sags, drop to your knees',
      'Keep your neck neutral, looking at the floor'
    ],
    imageSlot: 'plank-guide.jpg'
  },
  {
    name: 'Lunges',
    category: 'Lower Body',
    description: 'A unilateral exercise that improves balance and leg strength.',
    steps: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg, lowering your hips',
      'Both knees should bend to about 90 degrees',
      'Keep your front knee over your ankle, not past your toes',
      'Push through your front heel to return to standing'
    ],
    tips: [
      'Keep your torso upright throughout the movement',
      'Take a big enough step to maintain balance',
      'Alternate legs or complete all reps on one side first'
    ],
    imageSlot: 'lunges-guide.jpg'
  },
  {
    name: 'Burpees',
    category: 'Full Body',
    description: 'A high-intensity full-body exercise that builds strength and cardio endurance.',
    steps: [
      'Start standing with feet shoulder-width apart',
      'Drop into a squat and place hands on the floor',
      'Jump your feet back into a plank position',
      'Perform a push-up (optional for easier version)',
      'Jump feet forward to hands and explosively jump up'
    ],
    tips: [
      'Land softly to protect your joints',
      'Modify by stepping instead of jumping if needed',
      'Keep your core engaged throughout'
    ],
    imageSlot: 'burpees-guide.jpg'
  },
  {
    name: 'Glute Bridges',
    category: 'Lower Body',
    description: 'An excellent exercise for activating and strengthening the glutes.',
    steps: [
      'Lie on your back with knees bent, feet flat on the floor',
      'Keep your arms at your sides, palms down',
      'Push through your heels to lift your hips off the ground',
      'Squeeze your glutes at the top of the movement',
      'Lower back down with control'
    ],
    tips: [
      'Don\'t hyperextend your lower back at the top',
      'Keep your core engaged to protect your spine',
      'Place feet hip-width apart for stability'
    ],
    imageSlot: 'glute-bridges-guide.jpg'
  },
  {
    name: 'Mountain Climbers',
    category: 'Full Body',
    description: 'A dynamic exercise that combines cardio with core and upper body work.',
    steps: [
      'Start in a high plank position, hands under shoulders',
      'Drive one knee toward your chest',
      'Quickly switch legs, bringing the other knee forward',
      'Continue alternating at a fast pace',
      'Keep your hips level and core tight'
    ],
    tips: [
      'Don\'t let your hips bounce up and down',
      'Keep your shoulders over your wrists',
      'Start slow and increase speed as you improve'
    ],
    imageSlot: 'mountain-climbers-guide.jpg'
  },
  {
    name: 'Tricep Dips',
    category: 'Upper Body',
    description: 'An effective exercise for targeting the triceps using your body weight.',
    steps: [
      'Sit on the edge of a chair or bench, hands gripping the edge',
      'Slide your hips off the edge, supporting your weight',
      'Lower your body by bending your elbows to about 90 degrees',
      'Keep your back close to the chair/bench',
      'Push through your palms to extend your arms'
    ],
    tips: [
      'Keep your shoulders down, away from your ears',
      'Don\'t dip too low to avoid shoulder strain',
      'Keep your core engaged throughout'
    ],
    imageSlot: 'tricep-dips-guide.jpg'
  },
];

const ExerciseGuides = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseGuide | null>(null);

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
      <Navbar showBack backLabel="Back to Workouts" backPath="/workout" />

      <header className="text-center pt-32 pb-12 px-8 bg-primary/10 border-b-[3px] border-primary mt-[70px]">
        <h1 className="text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_20px_hsla(0,100%,50%,0.6)] mb-4 tracking-wider animate-slideUp">
          📖 Exercise Guides
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          Learn proper form and technique for each exercise.
        </p>
      </header>

      <section className="max-w-[900px] mx-auto py-12 px-4 md:px-8 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {exerciseGuides.map((guide, index) => (
            <div
              key={guide.name}
              className="fitness-panel p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_hsla(0,100%,50%,0.4)] animate-slideUp"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setSelectedExercise(guide)}
            >
              {/* IMAGE PLACEHOLDER */}
              <div className="w-full h-32 bg-primary/20 rounded-lg flex items-center justify-center mb-4 border-2 border-primary/30">
                <span className="text-4xl">
                  {guide.category === 'Upper Body' ? '💪' : 
                   guide.category === 'Lower Body' ? '🦵' : 
                   guide.category === 'Core' ? '🎯' : '🏃'}
                </span>
                {/* To add images:
                <img 
                  src={`/guide-images/${guide.imageSlot}`} 
                  alt={guide.name}
                  className="w-full h-full object-cover rounded-lg"
                /> */}
              </div>
              
              <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded">{guide.category}</span>
              <h3 className="text-xl font-semibold text-primary mt-2">{guide.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{guide.description}</p>
            </div>
          ))}
        </div>

        {/* Note about adding images */}
        <div className="mt-8 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <h4 className="text-primary font-semibold mb-2">📷 Adding Guide Images</h4>
          <p className="text-muted-foreground text-sm">
            Place exercise guide images in <code className="bg-primary/20 px-1 rounded">public/guide-images/</code> folder.
          </p>
        </div>
      </section>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div 
          className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <div 
            className="fitness-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded">{selectedExercise.category}</span>
                <h2 className="text-2xl font-bold text-primary mt-2">{selectedExercise.name}</h2>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-muted-foreground hover:text-primary text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-muted-foreground mb-6">{selectedExercise.description}</p>

            {/* IMAGE PLACEHOLDER */}
            <div className="w-full h-48 bg-primary/20 rounded-lg flex items-center justify-center mb-6 border-2 border-primary/30">
              <span className="text-6xl">
                {selectedExercise.category === 'Upper Body' ? '💪' : 
                 selectedExercise.category === 'Lower Body' ? '🦵' : 
                 selectedExercise.category === 'Core' ? '🎯' : '🏃'}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Steps</h3>
              <ol className="list-decimal list-inside space-y-2">
                {selectedExercise.steps.map((step, i) => (
                  <li key={i} className="text-foreground">{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">Tips</h3>
              <ul className="list-disc list-inside space-y-2">
                {selectedExercise.tips.map((tip, i) => (
                  <li key={i} className="text-muted-foreground">{tip}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedExercise(null)}
              className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-semibold transition-all hover:bg-primary/90"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseGuides;
