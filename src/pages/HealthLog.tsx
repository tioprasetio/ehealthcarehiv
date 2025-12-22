import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ClipboardList, Save, Calendar } from 'lucide-react';

interface HealthLog {
  id: string;
  log_date: string;
  has_nausea: boolean;
  has_dizziness: boolean;
  has_weakness: boolean;
  has_skin_rash: boolean;
  additional_notes: string | null;
  created_at: string;
}

const symptoms = [
  { key: 'has_nausea', label: 'Mual', icon: '🤢' },
  { key: 'has_dizziness', label: 'Pusing', icon: '😵' },
  { key: 'has_weakness', label: 'Lemas', icon: '😓' },
  { key: 'has_skin_rash', label: 'Ruam Kulit', icon: '🔴' },
] as const;

export default function HealthLog() {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<HealthLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<HealthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    has_nausea: false,
    has_dizziness: false,
    has_weakness: false,
    has_skin_rash: false,
    additional_notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    const today = format(new Date(), 'yyyy-MM-dd');

    const [todayRes, recentRes] = await Promise.all([
      supabase
        .from('daily_health_logs')
        .select('*')
        .eq('patient_id', user.id)
        .eq('log_date', today)
        .maybeSingle(),
      supabase
        .from('daily_health_logs')
        .select('*')
        .eq('patient_id', user.id)
        .order('log_date', { ascending: false })
        .limit(7),
    ]);

    if (todayRes.data) {
      setTodayLog(todayRes.data);
      setFormData({
        has_nausea: todayRes.data.has_nausea || false,
        has_dizziness: todayRes.data.has_dizziness || false,
        has_weakness: todayRes.data.has_weakness || false,
        has_skin_rash: todayRes.data.has_skin_rash || false,
        additional_notes: todayRes.data.additional_notes || '',
      });
    }

    if (recentRes.data) {
      setRecentLogs(recentRes.data);
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      if (todayLog) {
        // Update existing log
        const { error } = await supabase
          .from('daily_health_logs')
          .update(formData)
          .eq('id', todayLog.id);

        if (error) throw error;
        toast.success('Catatan kesehatan berhasil diperbarui');
      } else {
        // Create new log
        const { error } = await supabase.from('daily_health_logs').insert({
          patient_id: user.id,
          log_date: today,
          ...formData,
        });

        if (error) throw error;
        toast.success('Catatan kesehatan berhasil disimpan');
      }

      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan catatan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSymptomChange = (key: keyof typeof formData, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catatan Kesehatan Harian</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Log Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Catatan Hari Ini
              </CardTitle>
              <CardDescription>
                {todayLog ? 'Perbarui catatan kesehatan Anda' : 'Isi catatan kesehatan Anda hari ini'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Keluhan Hari Ini</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {symptoms.map(({ key, label, icon }) => (
                      <div
                        key={key}
                        className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                          formData[key] ? 'bg-warning/10 border-warning' : 'hover:bg-accent'
                        }`}
                      >
                        <Checkbox
                          id={key}
                          checked={formData[key]}
                          onCheckedChange={(checked) => handleSymptomChange(key, checked as boolean)}
                        />
                        <label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium">{label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan Tambahan</Label>
                  <Textarea
                    id="notes"
                    placeholder="Keluhan lain atau catatan tambahan..."
                    value={formData.additional_notes}
                    onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Menyimpan...' : todayLog ? 'Perbarui Catatan' : 'Simpan Catatan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Riwayat 7 Hari Terakhir
              </CardTitle>
              <CardDescription>Catatan kesehatan sebelumnya</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada catatan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log) => {
                    const activeSymptoms = symptoms.filter(({ key }) => log[key]);
                    const isToday = log.log_date === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <div
                        key={log.id}
                        className={`rounded-lg border p-4 ${isToday ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">
                            {format(new Date(log.log_date), 'EEEE, d MMM', { locale: id })}
                          </span>
                          {isToday && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Hari Ini
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeSymptoms.length > 0 ? (
                            activeSymptoms.map(({ key, label, icon }) => (
                              <span
                                key={key}
                                className="text-sm bg-warning/10 px-2 py-1 rounded"
                              >
                                {icon} {label}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-success">✓ Tidak ada keluhan</span>
                          )}
                        </div>
                        {log.additional_notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {log.additional_notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
