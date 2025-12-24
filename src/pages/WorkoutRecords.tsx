import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import FloatingParticles from '@/components/FloatingParticles';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkoutRecord {
  id: string;
  workout_type: string;
  workout_name: string;
  level: string | null;
  duration_minutes: number | null;
  notes: string | null;
  completed_at: string;
}

const WorkoutRecords = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [workoutType, setWorkoutType] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

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
      } else {
        fetchRecords(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRecords = async (userId: string) => {
    const { data, error } = await supabase
      .from('workout_records')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (!error && data) {
      setRecords(data);
    }
  };

  const handleAddRecord = async () => {
    if (!user || !workoutType || !workoutName) {
      toast.error('Please fill in workout type and name');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('workout_records').insert({
        user_id: user.id,
        workout_type: workoutType,
        workout_name: workoutName,
        level: level || null,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success('Workout recorded!');
      setShowForm(false);
      resetForm();
      fetchRecords(user.id);
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workout_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(records.filter(r => r.id !== id));
      toast.success('Record deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete record');
    }
  };

  const resetForm = () => {
    setWorkoutType('');
    setWorkoutName('');
    setLevel('');
    setDuration('');
    setNotes('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedRecords = records.reduce((acc, record) => {
    const date = new Date(record.completed_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, WorkoutRecord[]>);

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

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary drop-shadow-[0_0_20px_hsla(0,100%,50%,0.6)]">
            📊 Workout Records
          </h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? 'Cancel' : '+ Add Workout'}
          </Button>
        </div>

        {/* Add Workout Form */}
        {showForm && (
          <div className="fitness-panel p-6 mb-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-primary mb-4">Log New Workout</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Workout Type *</Label>
                <Select value={workoutType} onValueChange={setWorkoutType}>
                  <SelectTrigger className="mt-1 bg-background/50 border-primary/40">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Body">Full Body</SelectItem>
                    <SelectItem value="Upper Body">Upper Body</SelectItem>
                    <SelectItem value="Lower Body">Lower Body</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Sport">Sport</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Workout Name *</Label>
                <Input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="e.g., Push-ups, Running"
                  className="mt-1 bg-background/50 border-primary/40 focus:border-primary"
                />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="mt-1 bg-background/50 border-primary/40">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  className="mt-1 bg-background/50 border-primary/40 focus:border-primary"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="mt-1 bg-background/50 border-primary/40 focus:border-primary"
                />
              </div>
            </div>
            <Button
              onClick={handleAddRecord}
              disabled={saving}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? 'Saving...' : 'Save Workout'}
            </Button>
          </div>
        )}

        {/* Records List */}
        {Object.keys(groupedRecords).length === 0 ? (
          <div className="fitness-panel p-12 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <p className="text-muted-foreground text-lg">No workouts recorded yet</p>
            <p className="text-muted-foreground">Start logging your workouts to track your progress!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRecords).map(([date, dayRecords]) => (
              <div key={date} className="fitness-panel p-4">
                <h3 className="text-lg font-bold text-primary mb-3 border-b border-primary/30 pb-2">
                  📅 {date}
                </h3>
                <div className="space-y-3">
                  {dayRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{record.workout_name}</span>
                          <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                            {record.workout_type}
                          </span>
                          {record.level && (
                            <span className="px-2 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">
                              {record.level}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {record.duration_minutes && <span>{record.duration_minutes} min</span>}
                          {record.notes && <span className="ml-3">• {record.notes}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-destructive hover:text-red-400 text-sm ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutRecords;
