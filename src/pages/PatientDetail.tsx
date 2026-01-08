import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, User, ClipboardList, Image, Pill, Calendar } from 'lucide-react';

interface Profile {
  full_name: string;
  phone: string | null;
  created_at: string;
}

interface HealthLog {
  id: string;
  log_date: string;
  has_nausea: boolean;
  has_dizziness: boolean;
  has_weakness: boolean;
  has_skin_rash: boolean;
  additional_notes: string | null;
}

interface LabResult {
  id: string;
  image_url: string;
  description: string | null;
  test_date: string;
}

interface MedicationLog {
  id: string;
  taken_at: string;
  scheduled_date: string;
  medication_schedules: {
    medication_name: string;
    dosage: string;
  };
}

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    if (patientId) {
      fetchPatientData();
    }
  }, [role, patientId, navigate]);

  const fetchPatientData = async () => {
    if (!patientId) return;
    setIsLoading(true);

    const [profileRes, healthRes, labRes, medRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', patientId).maybeSingle(),
      supabase.from('daily_health_logs').select('*').eq('patient_id', patientId).order('log_date', { ascending: false }).limit(14),
      supabase.from('lab_results').select('*').eq('patient_id', patientId).order('test_date', { ascending: false }).limit(10),
      supabase.from('medication_logs').select('*, medication_schedules(medication_name, dosage)').eq('patient_id', patientId).order('taken_at', { ascending: false }).limit(20),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (healthRes.data) setHealthLogs(healthRes.data);
    if (labRes.data) setLabResults(labRes.data);
    if (medRes.data) setMedLogs(medRes.data as unknown as MedicationLog[]);

    setIsLoading(false);
  };

  const symptoms = [
    { key: 'has_nausea', label: 'Mual', icon: '🤢' },
    { key: 'has_dizziness', label: 'Pusing', icon: '😵' },
    { key: 'has_weakness', label: 'Lemas', icon: '😓' },
    { key: 'has_skin_rash', label: 'Ruam Kulit', icon: '🔴' },
  ] as const;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/4" />
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pasien tidak ditemukan</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/patients')}>
            Kembali
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
            <p className="text-muted-foreground">
              Terdaftar sejak {format(new Date(profile.created_at), 'd MMMM yyyy', { locale: id })}
            </p>
          </div>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Catatan
            </TabsTrigger>
            <TabsTrigger value="lab" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Hasil Lab
            </TabsTrigger>
            <TabsTrigger value="meds" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Riwayat Obat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-4">
            {healthLogs.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground">Belum ada catatan kesehatan</p>
                </CardContent>
              </Card>
            ) : (
              healthLogs.map((log) => {
                const activeSymptoms = symptoms.filter(({ key }) => log[key]);
                return (
                  <Card key={log.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(log.log_date), 'EEEE, d MMMM yyyy', { locale: id })}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {activeSymptoms.length > 0 ? (
                          activeSymptoms.map(({ key, label, icon }) => (
                            <Badge key={key} variant="secondary" className="bg-warning/10">
                              {icon} {label}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            ✓ Tidak ada keluhan
                          </Badge>
                        )}
                      </div>
                      {log.additional_notes && (
                        <p className="text-sm text-muted-foreground">{log.additional_notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="lab" className="space-y-4">
            {labResults.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground">Belum ada hasil lab</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {labResults.map((result) => (
                  <Card key={result.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted">
                      <img
                        src={result.image_url}
                        alt="Hasil lab"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        {format(new Date(result.test_date), 'd MMMM yyyy', { locale: id })}
                      </CardTitle>
                      {result.description && (
                        <CardDescription className="line-clamp-2">
                          {result.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="meds" className="space-y-4">
            {medLogs.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground">Belum ada riwayat minum obat</p>
                </CardContent>
              </Card>
            ) : (
              medLogs.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {log.medication_schedules?.medication_name || 'Obat'}
                        </CardTitle>
                        <CardDescription>
                          {log.medication_schedules?.dosage}
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{format(new Date(log.taken_at), 'd MMM yyyy', { locale: id })}</p>
                        <p>{format(new Date(log.taken_at), 'HH:mm', { locale: id })}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
