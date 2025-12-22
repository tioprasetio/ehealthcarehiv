import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface MedicationSchedule {
  id: string;
  medication_name: string;
  dosage: string;
  schedule_time: string;
  notes: string | null;
}

interface MedicationLog {
  schedule_id: string;
  scheduled_date: string;
}

export default function MedicationReminder() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [pendingMedications, setPendingMedications] = useState<MedicationSchedule[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSchedulesAndLogs();
      const interval = setInterval(checkPendingMedications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    checkPendingMedications();
  }, [schedules, logs]);

  const fetchSchedulesAndLogs = async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    const [schedulesRes, logsRes] = await Promise.all([
      supabase
        .from('medication_schedules')
        .select('*')
        .eq('patient_id', user.id),
      supabase
        .from('medication_logs')
        .select('schedule_id, scheduled_date')
        .eq('patient_id', user.id)
        .eq('scheduled_date', today),
    ]);

    if (schedulesRes.data) setSchedules(schedulesRes.data);
    if (logsRes.data) setLogs(logsRes.data);
  };

  const checkPendingMedications = () => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const today = format(now, 'yyyy-MM-dd');

    const pending = schedules.filter((schedule) => {
      const scheduleTime = schedule.schedule_time.slice(0, 5);
      const alreadyTaken = logs.some(
        (log) => log.schedule_id === schedule.id && log.scheduled_date === today
      );
      
      // Show if time has passed and not taken yet
      return scheduleTime <= currentTime && !alreadyTaken;
    });

    setPendingMedications(pending);
    setShowReminder(pending.length > 0);
  };

  const handleTakeMedication = async (scheduleId: string) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await supabase.from('medication_logs').insert({
        schedule_id: scheduleId,
        patient_id: user.id,
        scheduled_date: today,
      });

      if (error) throw error;

      toast.success('Suplemen berhasil diminum!');
      await fetchSchedulesAndLogs();
    } catch (error) {
      console.error('Error logging medication:', error);
      toast.error('Gagal mencatat suplemen');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showReminder || pendingMedications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 p-6 shadow-lg animate-slide-up">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 mb-4 animate-pulse-slow">
            <Pill className="h-8 w-8 text-warning animate-shake" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Waktunya Minum Suplemen!</h2>
          <p className="text-muted-foreground mt-2">
            Anda memiliki {pendingMedications.length} suplemen yang perlu diminum
          </p>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {pendingMedications.map((med) => (
            <div
              key={med.id}
              className="flex items-center justify-between p-4 rounded-lg bg-accent/50"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{med.medication_name}</h3>
                <p className="text-sm text-muted-foreground">{med.dosage}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{med.schedule_time.slice(0, 5)}</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleTakeMedication(med.id)}
                disabled={isLoading}
                className="ml-4"
              >
                <Check className="h-4 w-4 mr-1" />
                Sudah Minum
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4"
          onClick={() => setShowReminder(false)}
        >
          <X className="h-4 w-4 mr-2" />
          Tutup Sementara
        </Button>
      </Card>
    </div>
  );
}
