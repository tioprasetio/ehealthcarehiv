import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Pill, Calendar, Plus, Trash2, Clock, User } from "lucide-react";

interface Patient {
  user_id: string;
  full_name: string;
}

interface MedicationSchedule {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  schedule_time: string;
  notes: string | null;
  profiles?: { full_name: string };
}

interface ControlSchedule {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string | null;
  notes: string | null;
  profiles?: { full_name: string };
}

export default function ManageSchedules() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medSchedules, setMedSchedules] = useState<MedicationSchedule[]>([]);
  const [controlSchedules, setControlSchedules] = useState<ControlSchedule[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMedDialogOpen, setIsMedDialogOpen] = useState(false);
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false);

  const [medForm, setMedForm] = useState({
    patient_id: "",
    medication_name: "",
    dosage: "",
    schedule_time: "",
    notes: "",
  });

  const [controlForm, setControlForm] = useState({
    patient_id: "",
    scheduled_date: "",
    scheduled_time: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    setIsLoading(true);

    // Get patient IDs
    const { data: patientRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "patient");

    const patientIds = patientRoles?.map((r) => r.user_id) || [];

    if (patientIds.length > 0) {
      const [patientsRes, medRes, controlRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", patientIds),
        supabase
          .from("medication_schedules")
          .select(` *, profiles!medication_patient_profile_fk ( full_name ) `)
          .order("schedule_time"),
        supabase
          .from("control_schedules")
          .select(` *, profiles!control_patient_profile_fk ( full_name ) `)
          .order("scheduled_date"),
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (medRes.data)
        setMedSchedules(medRes.data as unknown as MedicationSchedule[]);
      if (controlRes.data)
        setControlSchedules(controlRes.data as unknown as ControlSchedule[]);
    }

    setIsLoading(false);
  };

  const handleAddMedSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("medication_schedules").insert({
        patient_id: medForm.patient_id,
        medication_name: medForm.medication_name,
        dosage: medForm.dosage,
        schedule_time: medForm.schedule_time,
        notes: medForm.notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Jadwal obat berhasil ditambahkan");
      setMedForm({
        patient_id: "",
        medication_name: "",
        dosage: "",
        schedule_time: "",
        notes: "",
      });
      setIsMedDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan jadwal obat");
    }
  };

  const handleAddControlSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("control_schedules").insert({
        patient_id: controlForm.patient_id,
        scheduled_date: controlForm.scheduled_date,
        scheduled_time: controlForm.scheduled_time,
        location: controlForm.location || null,
        notes: controlForm.notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Jadwal kontrol berhasil ditambahkan");
      setControlForm({
        patient_id: "",
        scheduled_date: "",
        scheduled_time: "",
        location: "",
        notes: "",
      });
      setIsControlDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan jadwal kontrol");
    }
  };

  const handleDeleteMed = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal obat ini?")) return;

    try {
      const { error } = await supabase
        .from("medication_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Jadwal obat berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus jadwal obat");
    }
  };

  const handleDeleteControl = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal kontrol ini?")) return;

    try {
      const { error } = await supabase
        .from("control_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Jadwal kontrol berhasil dihapus");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus jadwal kontrol");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Jadwal</h1>
          <p className="text-muted-foreground">
            Atur jadwal obat dan kontrol pasien
          </p>
        </div>

        <Tabs defaultValue="medication" className="space-y-6">
          <TabsList>
            <TabsTrigger value="medication" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Jadwal Obat
            </TabsTrigger>
            <TabsTrigger value="control" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jadwal Kontrol
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medication" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isMedDialogOpen} onOpenChange={setIsMedDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Jadwal Obat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Jadwal Obat</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddMedSchedule} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pasien</Label>
                      <Select
                        value={medForm.patient_id}
                        onValueChange={(v) =>
                          setMedForm({ ...medForm, patient_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pasien" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.user_id} value={p.user_id}>
                              {p.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Obat</Label>
                      <Input
                        value={medForm.medication_name}
                        onChange={(e) =>
                          setMedForm({
                            ...medForm,
                            medication_name: e.target.value,
                          })
                        }
                        placeholder="Contoh: ARV"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dosis</Label>
                      <Input
                        value={medForm.dosage}
                        onChange={(e) =>
                          setMedForm({ ...medForm, dosage: e.target.value })
                        }
                        placeholder="Contoh: 1 tablet"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jam Minum</Label>
                      <Input
                        type="time"
                        value={medForm.schedule_time}
                        onChange={(e) =>
                          setMedForm({
                            ...medForm,
                            schedule_time: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan (opsional)</Label>
                      <Textarea
                        value={medForm.notes}
                        onChange={(e) =>
                          setMedForm({ ...medForm, notes: e.target.value })
                        }
                        placeholder="Catatan tambahan..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsMedDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit">Simpan</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {medSchedules.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Pill className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Belum ada jadwal obat</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {medSchedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Pill className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {schedule.medication_name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {schedule.profiles?.full_name}
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              {schedule.schedule_time.slice(0, 5)}
                              <span>•</span>
                              {schedule.dosage}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteMed(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="control" className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={isControlDialogOpen}
                onOpenChange={setIsControlDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Jadwal Kontrol
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Jadwal Kontrol</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleAddControlSchedule}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Pasien</Label>
                      <Select
                        value={controlForm.patient_id}
                        onValueChange={(v) =>
                          setControlForm({ ...controlForm, patient_id: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pasien" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.user_id} value={p.user_id}>
                              {p.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal</Label>
                      <Input
                        type="date"
                        value={controlForm.scheduled_date}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            scheduled_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jam</Label>
                      <Input
                        type="time"
                        value={controlForm.scheduled_time}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            scheduled_time: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lokasi (opsional)</Label>
                      <Input
                        value={controlForm.location}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            location: e.target.value,
                          })
                        }
                        placeholder="Contoh: Poli HIV Lt. 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan (opsional)</Label>
                      <Textarea
                        value={controlForm.notes}
                        onChange={(e) =>
                          setControlForm({
                            ...controlForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Catatan tambahan..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsControlDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit">Simpan</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {controlSchedules.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Belum ada jadwal kontrol
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {controlSchedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {format(
                                new Date(schedule.scheduled_date),
                                "d MMMM yyyy",
                                { locale: id }
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {schedule.profiles?.full_name}
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              {schedule.scheduled_time.slice(0, 5)}
                              {schedule.location && (
                                <>
                                  <span>•</span>
                                  {schedule.location}
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteControl(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
