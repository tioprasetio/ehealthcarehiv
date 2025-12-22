import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Pill, Clock, Check, X } from 'lucide-react';

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
  taken_at: string;
}

export default function Medications() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    const today = format(new Date(), 'yyyy-MM-dd');

    const [schedulesRes, logsRes] = await Promise.all([
      supabase
        .from('medication_schedules')
        .select('*')
        .eq('patient_id', user.id)
        .order('schedule_time'),
      supabase
        .from('medication_logs')
        .select('schedule_id, scheduled_date, taken_at')
        .eq('patient_id', user.id)
        .eq('scheduled_date', today),
    ]);

    if (schedulesRes.error) {
      toast.error('Gagal memuat jadwal obat');
    } else {
      setSchedules(schedulesRes.data || []);
    }

    if (logsRes.data) {
      setLogs(logsRes.data);
    }

    setIsLoading(false);
  };

  const handleTakeMedication = async (scheduleId: string) => {
    if (!user) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await supabase.from('medication_logs').insert({
        schedule_id: scheduleId,
        patient_id: user.id,
        scheduled_date: today,
      });

      if (error) throw error;

      toast.success('Obat berhasil dicatat!');
      fetchData();
    } catch (error) {
      console.error('Error logging medication:', error);
      toast.error('Gagal mencatat obat');
    }
  };

  const isTaken = (scheduleId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return logs.some(
      (log) => log.schedule_id === scheduleId && log.scheduled_date === today
    );
  };

  const getLog = (scheduleId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return logs.find(
      (log) => log.schedule_id === scheduleId && log.scheduled_date === today
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Minum Obat</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Jadwal</h3>
              <p className="text-muted-foreground">
                Jadwal minum obat akan diatur oleh tenaga medis
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const taken = isTaken(schedule.id);
              const log = getLog(schedule.id);
              
              return (
                <Card 
                  key={schedule.id} 
                  className={`transition-all ${taken ? 'bg-success/5 border-success/30' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          taken ? 'bg-success/20' : 'bg-primary/10'
                        }`}>
                          <Pill className={`h-6 w-6 ${taken ? 'text-success' : 'text-primary'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{schedule.medication_name}</CardTitle>
                          <CardDescription>{schedule.dosage}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={taken ? 'default' : 'secondary'} className={taken ? 'bg-success' : ''}>
                        {taken ? 'Sudah Diminum' : 'Belum'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Jadwal: {schedule.schedule_time.slice(0, 5)}</span>
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-muted-foreground">{schedule.notes}</p>
                        )}
                        {taken && log && (
                          <p className="text-sm text-success">
                            Diminum pada: {format(new Date(log.taken_at), 'HH:mm', { locale: id })}
                          </p>
                        )}
                      </div>
                      {!taken && (
                        <Button onClick={() => handleTakeMedication(schedule.id)}>
                          <Check className="h-4 w-4 mr-2" />
                          Sudah Minum
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
