import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';

interface ControlSchedule {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export default function ControlSchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ControlSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  const fetchSchedules = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('control_schedules')
      .select('*')
      .eq('patient_id', user.id)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setSchedules(data || []);
    }
    setIsLoading(false);
  };

  const getStatus = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'past';
    return 'upcoming';
  };

  const upcomingSchedules = schedules.filter((s) => getStatus(s.scheduled_date) !== 'past');
  const pastSchedules = schedules.filter((s) => getStatus(s.scheduled_date) === 'past');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Kontrol</h1>
          <p className="text-muted-foreground">Jadwal kontrol yang diatur oleh tenaga medis</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
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
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Jadwal</h3>
              <p className="text-muted-foreground">
                Jadwal kontrol akan diatur oleh tenaga medis
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Schedules */}
            {upcomingSchedules.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Jadwal Mendatang</h2>
                <div className="space-y-4">
                  {upcomingSchedules.map((schedule) => {
                    const status = getStatus(schedule.scheduled_date);
                    
                    return (
                      <Card 
                        key={schedule.id}
                        className={`transition-all ${
                          status === 'today' 
                            ? 'border-primary bg-primary/5 shadow-glow' 
                            : ''
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg ${
                                status === 'today' 
                                  ? 'gradient-primary text-primary-foreground' 
                                  : 'bg-accent text-accent-foreground'
                              }`}>
                                <span className="text-lg font-bold">
                                  {format(new Date(schedule.scheduled_date), 'd')}
                                </span>
                                <span className="text-xs uppercase">
                                  {format(new Date(schedule.scheduled_date), 'MMM', { locale: id })}
                                </span>
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {format(new Date(schedule.scheduled_date), 'EEEE', { locale: id })}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {schedule.scheduled_time.slice(0, 5)}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={status === 'today' ? 'bg-primary' : 'bg-accent text-accent-foreground'}>
                              {status === 'today' ? 'Hari Ini' : 'Mendatang'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {schedule.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{schedule.location}</span>
                            </div>
                          )}
                          {schedule.notes && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4 mt-0.5" />
                              <span>{schedule.notes}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Schedules */}
            {pastSchedules.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Riwayat Kontrol</h2>
                <div className="space-y-3">
                  {pastSchedules.slice(0, 5).map((schedule) => (
                    <Card key={schedule.id} className="bg-muted/50">
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground text-sm font-medium">
                              {format(new Date(schedule.scheduled_date), 'd')}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {format(new Date(schedule.scheduled_date), 'd MMMM yyyy', { locale: id })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {schedule.scheduled_time.slice(0, 5)}
                                {schedule.location && ` • ${schedule.location}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">Selesai</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
