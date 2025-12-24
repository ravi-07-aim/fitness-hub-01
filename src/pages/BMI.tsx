import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';

interface BMIRecord {
  id: string;
  weight: number;
  height: number;
  bmi: number;
  category: string;
  unit_system: string;
  created_at: string;
}

const BMI = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [bmiResult, setBmiResult] = useState<{ bmi: number; category: string } | null>(null);
  const [history, setHistory] = useState<BMIRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/auth');
      } else {
        fetchHistory(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('bmi_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching BMI history:', error);
    } else {
      setHistory(data || []);
    }
  };

  const calculateBMI = () => {
    let weightKg: number;
    let heightM: number;

    if (unitSystem === 'metric') {
      weightKg = parseFloat(weight);
      heightM = parseFloat(height) / 100;
    } else {
      weightKg = parseFloat(weight) * 0.453592;
      const totalInches = parseFloat(feet) * 12 + parseFloat(inches);
      heightM = totalInches * 0.0254;
    }

    if (isNaN(weightKg) || isNaN(heightM) || heightM <= 0 || weightKg <= 0) {
      toast.error('Please enter valid values');
      return;
    }

    const bmi = weightKg / (heightM * heightM);
    let category: string;

    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    setBmiResult({ bmi: Math.round(bmi * 10) / 10, category });
  };

  const saveBMI = async () => {
    if (!bmiResult || !user) return;

    let weightVal: number;
    let heightVal: number;

    if (unitSystem === 'metric') {
      weightVal = parseFloat(weight);
      heightVal = parseFloat(height);
    } else {
      weightVal = parseFloat(weight);
      heightVal = parseFloat(feet) * 12 + parseFloat(inches);
    }

    const { error } = await supabase.from('bmi_history').insert({
      user_id: user.id,
      weight: weightVal,
      height: heightVal,
      bmi: bmiResult.bmi,
      category: bmiResult.category,
      unit_system: unitSystem,
    });

    if (error) {
      toast.error('Failed to save BMI record');
      console.error(error);
    } else {
      toast.success('BMI record saved!');
      fetchHistory(user.id);
    }
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('bmi_history').delete().eq('id', id);
    
    if (error) {
      toast.error('Failed to delete record');
    } else {
      toast.success('Record deleted');
      if (user) fetchHistory(user.id);
    }
  };

  const getGaugeColor = (bmi: number) => {
    if (bmi < 18.5) return '#3b82f6';
    if (bmi < 25) return '#22c55e';
    if (bmi < 30) return '#f59e0b';
    return '#ef4444';
  };

  const getGaugeOffset = (bmi: number) => {
    const maxBmi = 40;
    const percentage = Math.min(bmi / maxBmi, 1);
    return 440 - (440 * percentage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center">
        <div className="text-primary text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#330000_0%,#000000_55%,#000000_100%)] text-foreground flex items-center justify-center p-4 overflow-hidden">
      <FloatingParticles />
      
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-6 relative z-10">
        {/* Calculator Panel */}
        <div className="fitness-panel p-6">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)]">
                BMI Calculator
              </h1>
            </div>

            {/* Unit Toggle */}
            <div className="flex bg-primary/20 rounded-full p-1 mb-6">
              <button
                onClick={() => setUnitSystem('metric')}
                className={`flex-1 py-2 rounded-full font-semibold text-sm transition-all ${
                  unitSystem === 'metric' 
                    ? 'bg-primary text-primary-foreground shadow-glow-red' 
                    : 'text-muted-foreground'
                }`}
              >
                Metric (kg/cm)
              </button>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`flex-1 py-2 rounded-full font-semibold text-sm transition-all ${
                  unitSystem === 'imperial' 
                    ? 'bg-primary text-primary-foreground shadow-glow-red' 
                    : 'text-muted-foreground'
                }`}
              >
                Imperial (lb/ft)
              </button>
            </div>

            {/* Input Fields */}
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-fitness-red-glow text-sm">
                  Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unitSystem === 'metric' ? '70' : '154'}
                  className="w-full px-4 py-3 bg-foreground/5 border-2 border-primary/35 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:shadow-[0_0_14px_hsla(0,100%,50%,0.4)] focus:bg-foreground/10 transition-all"
                />
              </div>

              {unitSystem === 'metric' ? (
                <div>
                  <label className="block mb-1 text-fitness-red-glow text-sm">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    className="w-full px-4 py-3 bg-foreground/5 border-2 border-primary/35 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:shadow-[0_0_14px_hsla(0,100%,50%,0.4)] focus:bg-foreground/10 transition-all"
                  />
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block mb-1 text-fitness-red-glow text-sm">Feet</label>
                    <input
                      type="number"
                      value={feet}
                      onChange={(e) => setFeet(e.target.value)}
                      placeholder="5"
                      className="w-full px-4 py-3 bg-foreground/5 border-2 border-primary/35 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:shadow-[0_0_14px_hsla(0,100%,50%,0.4)] focus:bg-foreground/10 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-fitness-red-glow text-sm">Inches</label>
                    <input
                      type="number"
                      value={inches}
                      onChange={(e) => setInches(e.target.value)}
                      placeholder="9"
                      className="w-full px-4 py-3 bg-foreground/5 border-2 border-primary/35 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary focus:shadow-[0_0_14px_hsla(0,100%,50%,0.4)] focus:bg-foreground/10 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={calculateBMI}
              className="w-full mt-5 py-3 bg-gradient-to-r from-primary to-fitness-red-dark text-primary-foreground rounded-full font-bold uppercase tracking-wider shadow-glow-red-intense transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_hsla(0,100%,50%,0.55)]"
            >
              Calculate BMI
            </button>

            {bmiResult && (
              <button
                onClick={saveBMI}
                className="w-full mt-3 py-3 bg-transparent border-2 border-primary text-primary rounded-full font-bold uppercase tracking-wider transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-glow-red-intense"
              >
                Save to History
              </button>
            )}

            {/* Result Display */}
            {bmiResult && (
              <div className="mt-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#331111"
                        strokeWidth="10"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke={getGaugeColor(bmiResult.bmi)}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray="440"
                        strokeDashoffset={getGaugeOffset(bmiResult.bmi)}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-5 rounded-full bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.25),transparent_55%)] shadow-[0_18px_25px_rgba(0,0,0,0.9),0_0_35px_hsla(0,100%,50%,0.6)] flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold tracking-wide drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
                        {bmiResult.bmi}
                      </span>
                      <span className="text-sm text-pink-200">{bmiResult.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        <div className="fitness-panel p-6">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-primary drop-shadow-[0_0_12px_hsla(0,100%,50%,0.6)] mb-4">
              BMI History
            </h2>
            
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No records yet. Calculate and save your BMI!</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {history.map((record) => (
                  <div 
                    key={record.id}
                    className="bg-background/50 border border-primary/30 rounded-lg p-3 flex justify-between items-center hover:border-primary transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-primary">{record.bmi} - {record.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString()} • {record.weight}{record.unit_system === 'metric' ? 'kg' : 'lbs'}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="text-destructive hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMI;
