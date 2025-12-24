import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';

type TabType = 'rules' | 'warmups' | 'drills';

interface SportData {
  title: string;
  icon: string;
  description: string;
  rules: string[];
  warmups: { name: string; duration: string; description: string }[];
  drills: { name: string; duration: string; description: string }[];
}

const sportsData: Record<string, SportData> = {
  cricket: {
    title: 'Cricket',
    icon: '🏏',
    description: 'A bat-and-ball game played between two teams of eleven players.',
    rules: [
      'Each team takes turns batting and fielding/bowling',
      'The batting team tries to score runs by hitting the ball and running between wickets',
      'The fielding team tries to dismiss batters and limit runs scored',
      'A batter is out if: bowled, caught, LBW, stumped, run out, or hit wicket',
      'An innings ends when 10 batters are out or overs are completed',
      'The team with more runs at the end wins',
      'In limited overs cricket, each team has a set number of overs to bat',
      'Wide balls and no-balls give extra runs and require re-bowling',
    ],
    warmups: [
      { name: 'Light Jogging', duration: '5 mins', description: 'Easy jog around the field to raise heart rate' },
      { name: 'Dynamic Stretches', duration: '5 mins', description: 'Leg swings, arm circles, hip rotations' },
      { name: 'Catch Practice', duration: '5 mins', description: 'Simple catches in pairs to warm up hands' },
      { name: 'Throwing Drills', duration: '5 mins', description: 'Short throws progressing to longer distances' },
      { name: 'Shadow Batting', duration: '3 mins', description: 'Practice batting strokes without ball' },
    ],
    drills: [
      { name: 'Net Practice', duration: '20 mins', description: 'Batting against bowlers in the nets' },
      { name: 'Slip Catching', duration: '10 mins', description: 'Reaction catches in slip cordon positions' },
      { name: 'Bowling Target Practice', duration: '15 mins', description: 'Bowl at specific targets on the pitch' },
      { name: 'Running Between Wickets', duration: '10 mins', description: 'Quick singles and communication drills' },
      { name: 'Fielding Circuits', duration: '15 mins', description: 'Ground fielding, throwing, and catching stations' },
    ],
  },
  football: {
    title: 'Football',
    icon: '⚽',
    description: 'The world\'s most popular sport, played between two teams of eleven players.',
    rules: [
      'Match consists of two 45-minute halves',
      'Only the goalkeeper can handle the ball within the penalty area',
      'A goal is scored when the ball crosses the goal line between posts',
      'Offside: player cannot be closer to goal than second-last defender when ball is played',
      'Fouls result in free kicks or penalties depending on location',
      'Yellow card is a warning; two yellows or one red results in sending off',
      'Throw-ins, corner kicks, and goal kicks restart play when ball goes out',
      'The team with most goals at the end wins',
    ],
    warmups: [
      { name: 'Light Jogging', duration: '5 mins', description: 'Easy jog around the pitch' },
      { name: 'Dynamic Stretches', duration: '5 mins', description: 'Leg swings, hip circles, walking lunges' },
      { name: 'Ball Control', duration: '5 mins', description: 'Dribbling and touches while moving' },
      { name: 'Passing Pairs', duration: '5 mins', description: 'Short passes with a partner' },
      { name: 'Shooting Practice', duration: '5 mins', description: 'Light shots on goal' },
    ],
    drills: [
      { name: 'Rondo', duration: '10 mins', description: 'Keep-away game in small circles' },
      { name: 'Passing Triangles', duration: '10 mins', description: 'One-touch passing in triangle formations' },
      { name: 'Dribbling Course', duration: '10 mins', description: 'Cone dribbling for close control' },
      { name: 'Small-Sided Games', duration: '15 mins', description: '5v5 or 7v7 practice matches' },
      { name: 'Set Piece Practice', duration: '10 mins', description: 'Corners, free kicks, and penalties' },
    ],
  },
  volleyball: {
    title: 'Volleyball',
    icon: '🏐',
    description: 'A team sport where two teams of six players hit a ball over a net.',
    rules: [
      'Each team can touch the ball maximum 3 times before sending over net',
      'Rally point scoring: every rally wins a point regardless of serving team',
      'Sets are played to 25 points (win by 2), deciding set to 15 points',
      'Players rotate positions clockwise when winning serve from opponents',
      'The ball can touch the net during play but not during serve',
      'Players cannot touch the net or cross the center line',
      'Back row players cannot attack from front of attack line',
      'A block does not count as one of the three touches',
    ],
    warmups: [
      { name: 'Jogging & Shuffles', duration: '5 mins', description: 'Light jog with lateral shuffles' },
      { name: 'Arm Circles', duration: '3 mins', description: 'Forward and backward arm rotations' },
      { name: 'Partner Passing', duration: '5 mins', description: 'Forearm passes with a partner' },
      { name: 'Setting Drills', duration: '5 mins', description: 'Overhead sets to self and partner' },
      { name: 'Light Spiking', duration: '5 mins', description: 'Easy approach and hit practice' },
    ],
    drills: [
      { name: 'Pepper Drill', duration: '10 mins', description: 'Continuous dig-set-spike with partner' },
      { name: 'Serve Receive', duration: '10 mins', description: 'Practice receiving different serve types' },
      { name: 'Blocking Footwork', duration: '10 mins', description: 'Lateral movement and jump timing' },
      { name: 'Transition Drill', duration: '10 mins', description: 'Defense to attack transitions' },
      { name: 'Game Situations', duration: '15 mins', description: 'Practice specific game scenarios' },
    ],
  },
  kabaddi: {
    title: 'Kabaddi',
    icon: '🤼',
    description: 'A contact team sport where raiders try to tag defenders and return safely.',
    rules: [
      'Two teams of 7 players take turns raiding and defending',
      'Raider must chant "kabaddi" continuously during the raid',
      'Raider scores points by tagging defenders and returning to their half',
      'Defenders score by tackling the raider before they return',
      'Raider must return within 30 seconds',
      'Tagged or tackled players are out until revived by team scoring',
      'Bonus points available for crossing bonus line (with at least 6 defenders)',
      'Match consists of two 20-minute halves',
    ],
    warmups: [
      { name: 'Dynamic Stretching', duration: '5 mins', description: 'Leg swings, lunges, hip mobility' },
      { name: 'Light Sprints', duration: '5 mins', description: 'Short bursts of speed' },
      { name: 'Agility Ladder', duration: '5 mins', description: 'Quick feet and coordination' },
      { name: 'Core Activation', duration: '5 mins', description: 'Planks and twists for core strength' },
      { name: 'Partner Holds', duration: '5 mins', description: 'Light grappling and balance work' },
    ],
    drills: [
      { name: 'Raiding Practice', duration: '10 mins', description: 'Touch and return techniques' },
      { name: 'Chain Formation', duration: '10 mins', description: 'Defensive chain coordination' },
      { name: 'Ankle Hold Defense', duration: '10 mins', description: 'Low tackle technique practice' },
      { name: 'Escape Drills', duration: '10 mins', description: 'Breaking free from defenders' },
      { name: 'Mock Raids', duration: '15 mins', description: 'Full raid simulations with scoring' },
    ],
  },
  athletics: {
    title: 'Athletics',
    icon: '🏃',
    description: 'Track and field events including running, jumping, and throwing disciplines.',
    rules: [
      'Track events: races over various distances from 100m to marathon',
      'Field events: jumps (long, triple, high, pole vault) and throws (shot, discus, javelin, hammer)',
      'False start in sprints results in disqualification',
      'In jumps, athletes get a set number of attempts',
      'Throws must land within a marked sector to be valid',
      'Relay races require baton exchange within a zone',
      'Combined events (decathlon/heptathlon) score points across multiple disciplines',
      'Photo finish and electronic timing used for close races',
    ],
    warmups: [
      { name: 'Light Jogging', duration: '5 mins', description: 'Easy jog to raise heart rate' },
      { name: 'Dynamic Stretches', duration: '5 mins', description: 'A-skips, B-skips, high knees' },
      { name: 'Strides', duration: '5 mins', description: 'Gradual accelerations to near max speed' },
      { name: 'Event-Specific Prep', duration: '5 mins', description: 'Drills specific to your event' },
      { name: 'Practice Attempts', duration: '5 mins', description: 'Light practice runs/throws/jumps' },
    ],
    drills: [
      { name: 'Sprint Starts', duration: '10 mins', description: 'Block starts and first 30m acceleration' },
      { name: 'Hurdle Technique', duration: '10 mins', description: 'Lead leg and trail leg drills' },
      { name: 'Jump Approach', duration: '10 mins', description: 'Run-up consistency and takeoff' },
      { name: 'Throwing Technique', duration: '10 mins', description: 'Release angle and power generation' },
      { name: 'Endurance Intervals', duration: '15 mins', description: 'Tempo runs or interval training' },
    ],
  },
};

const SportDetail = () => {
  const navigate = useNavigate();
  const { sport } = useParams<{ sport: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('rules');

  const sportData = sport ? sportsData[sport] : null;

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

  if (!sportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-primary text-3xl mb-4">Sport not found</h1>
          <button
            onClick={() => navigate('/sports')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold"
          >
            Back to Sports
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'rules', label: 'Rules' },
    { key: 'warmups', label: 'Warm-ups' },
    { key: 'drills', label: 'Drills' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background text-foreground overflow-x-hidden">
      <FloatingParticles />
      <Navbar showBack backLabel="Back to Sports" backPath="/sports" />

      <header className="text-center pt-32 pb-12 px-8 bg-primary/10 border-b-[3px] border-primary mt-[70px]">
        <h1 className="text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_20px_hsla(0,100%,50%,0.6)] mb-4 tracking-wider animate-slideUp">
          {sportData.icon} {sportData.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          {sportData.description}
        </p>
      </header>

      <section className="max-w-[900px] mx-auto py-12 px-4 md:px-8 pb-16">
        {/* Tabs */}
        <div className="flex bg-primary/20 rounded-full p-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 rounded-full font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">Game Rules</h2>
            {sportData.rules.map((rule, index) => (
              <div
                key={index}
                className="fitness-panel p-4 flex items-start gap-4 animate-slideUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="text-primary font-bold text-lg">{index + 1}</span>
                <p className="text-foreground">{rule}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'warmups' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">Warm-up Routine</h2>
            {sportData.warmups.map((warmup, index) => (
              <div
                key={index}
                className="fitness-panel p-4 animate-slideUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-primary">{warmup.name}</h3>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                    {warmup.duration}
                  </span>
                </div>
                <p className="text-muted-foreground">{warmup.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'drills' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">Training Drills</h2>
            {sportData.drills.map((drill, index) => (
              <div
                key={index}
                className="fitness-panel p-4 animate-slideUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-primary">{drill.name}</h3>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                    {drill.duration}
                  </span>
                </div>
                <p className="text-muted-foreground">{drill.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SportDetail;
