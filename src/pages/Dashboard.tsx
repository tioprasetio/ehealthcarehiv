import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import MedicationReminder from '@/components/MedicationReminder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Pill, 
  ClipboardList, 
  Calendar, 
  BookOpen, 
  ChevronRight,
  Users,
  FileText,
  Clock
} from 'lucide-react';
import { MenuCard } from '@/components/MenuCard';
import MainMenuPatient from "@/assets/main_menu_pasien.svg";
import MainMenuJadwal from "@/assets/main_menu_jadwal.svg";
import MainMenuEdukasi from "@/assets/main_menu_edukasi.svg";
import MainMenuMedis from "@/assets/main_menu_medis.svg";
import AksiCepatJadwalObat from "@/assets/main_menu_jadwal_obat.svg";
import AksiCepatCatatanKesehatan from "@/assets/main_menu_catatan_kesehatan.svg";
import AksiCepatHasilLab from "@/assets/main_menu_hasil_lab.svg";
import AksiCepatJadwalKontrol from "@/assets/main_menu_jadwal_kontrol.svg";

interface Profile {
  full_name: string;
}

interface Stats {
  todayMedsTaken: number;
  totalMeds: number;
  upcomingControl: string | null;
  todayLogExists: boolean;
}

interface AdminStats {
  totalPatients: number;
  totalArticles: number;
  pendingControls: number;
}

export default function Dashboard() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (role === 'patient') {
        fetchPatientStats();
      } else if (role === 'admin') {
        fetchAdminStats();
      }
    }
  }, [user, role]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) setProfile(data);
  };

  const fetchPatientStats = async () => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');

    const [medsRes, logsRes, controlRes, healthLogRes] = await Promise.all([
      supabase.from('medication_schedules').select('id').eq('patient_id', user.id),
      supabase.from('medication_logs').select('id').eq('patient_id', user.id).eq('scheduled_date', today),
      supabase.from('control_schedules').select('scheduled_date, scheduled_time').eq('patient_id', user.id).gte('scheduled_date', today).order('scheduled_date').limit(1),
      supabase.from('daily_health_logs').select('id').eq('patient_id', user.id).eq('log_date', today),
    ]);

    setStats({
      totalMeds: medsRes.data?.length || 0,
      todayMedsTaken: logsRes.data?.length || 0,
      upcomingControl: controlRes.data?.[0] ? `${controlRes.data[0].scheduled_date} ${controlRes.data[0].scheduled_time}` : null,
      todayLogExists: (healthLogRes.data?.length || 0) > 0,
    });
  };

  const fetchAdminStats = async () => {
    const [patientsRes, articlesRes, controlsRes] = await Promise.all([
      supabase.from('user_roles').select('id').eq('role', 'patient'),
      supabase.from('education_articles').select('id'),
      supabase.from('control_schedules').select('id').gte('scheduled_date', format(new Date(), 'yyyy-MM-dd')),
    ]);

    setAdminStats({
      totalPatients: patientsRes.data?.length || 0,
      totalArticles: articlesRes.data?.length || 0,
      pendingControls: controlsRes.data?.length || 0,
    });
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <DashboardLayout>
      {role === "patient" && <MedicationReminder />}

      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {profile?.full_name || ""}! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </p>
        </div>

        {/* Patient Dashboard */}
        {role === "patient" && stats && (
          <>
            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Obat Hari Ini
                  </CardTitle>
                  <Pill className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.todayMedsTaken}/{stats.totalMeds}
                  </div>
                  <p className="text-xs text-muted-foreground">sudah diminum</p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Catatan Hari Ini
                  </CardTitle>
                  <ClipboardList className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.todayLogExists ? "✓" : "–"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.todayLogExists ? "Sudah diisi" : "Belum diisi"}
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jadwal Kontrol
                  </CardTitle>
                  <Calendar className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-foreground">
                    {stats.upcomingControl
                      ? format(
                          new Date(stats.upcomingControl.split(" ")[0]),
                          "d MMM",
                          { locale: id }
                        )
                      : "–"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.upcomingControl
                      ? "kontrol berikutnya"
                      : "Tidak ada jadwal"}
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Edukasi
                  </CardTitle>
                  <BookOpen className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <Link to="/education">
                    <Button variant="outline" size="sm" className="w-full">
                      Baca Artikel
                      <ChevronRight className="h-6 w-6 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
                <CardDescription>
                  Akses fitur yang sering digunakan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MenuCard
                    title="Jadwal Minum Obat"
                    description="Lihat jadwal minum obat"
                    image={AksiCepatJadwalObat}
                    href="/medications"
                  />

                  <MenuCard
                    title="Catatan Kesehatan"
                    description="Buat catatan"
                    image={AksiCepatCatatanKesehatan}
                    href="/health-log"
                  />

                  <MenuCard
                    title="Upload Hasil Lab"
                    description="Upload hasil pemeriksaan"
                    image={AksiCepatHasilLab}
                    href="/lab-results"
                  />

                  <MenuCard
                    title="Jawal Kontrol"
                    description="Lihat jadwal kontrol"
                    image={AksiCepatJadwalKontrol}
                    href="/control-schedule"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Admin Dashboard */}
        {role === "admin" && adminStats && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pasien
                  </CardTitle>
                  <Users className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {adminStats.totalPatients}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    pasien terdaftar
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Artikel Edukasi
                  </CardTitle>
                  <BookOpen className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {adminStats.totalArticles}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    artikel tersedia
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jadwal Kontrol
                  </CardTitle>
                  <Clock className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {adminStats.pendingControls}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    jadwal mendatang
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Menu Utama</CardTitle>
                <CardDescription>Kelola data pasien dan jadwal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <MenuCard
                    title="Daftar Pasien"
                    description="Kelola data pasien"
                    image={MainMenuPatient}
                    href="/patients"
                  />

                  <MenuCard
                    title="Kelola Jadwal"
                    description="Atur jadwal pemeriksaan"
                    image={MainMenuJadwal}
                    href="/manage-schedules"
                  />

                  <MenuCard
                    title="Edukasi"
                    description="Materi edukasi"
                    image={MainMenuEdukasi}
                    href="/education"
                  />

                  <MenuCard
                    title="Tenaga Medis"
                    description="Data dokter & perawat"
                    image={MainMenuMedis}
                    href="/staff"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
