import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  Card,
  CardContent
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
import { Pill, Calendar, Plus } from "lucide-react";
import { ScheduleMenuCard } from "@/components/ScheduleMenuCard";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "med" | "control";
    name: string;
  } | null>(null);

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

  const openDeleteDialog = (
    id: string,
    type: "med" | "control",
    name: string
  ) => {
    setDeleteTarget({ id, type, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const table =
        deleteTarget.type === "med"
          ? "medication_schedules"
          : "control_schedules";
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;

      toast.success(
        deleteTarget.type === "med"
          ? "Jadwal obat berhasil dihapus"
          : "Jadwal kontrol berhasil dihapus"
      );
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        deleteTarget.type === "med"
          ? "Gagal menghapus jadwal obat"
          : "Gagal menghapus jadwal kontrol"
      );
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
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
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {medSchedules.map((schedule) => (
                    <ScheduleMenuCard
                      key={schedule.id}
                      type="med"
                      schedule={schedule}
                      onDelete={() =>
                        openDeleteDialog(
                          schedule.id,
                          "med",
                          schedule.medication_name
                        )
                      }
                    />
                  ))}
                </div>
              </CardContent>
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
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {controlSchedules.map((schedule) => (
                    <ScheduleMenuCard
                      key={schedule.id}
                      type="control"
                      schedule={schedule}
                      onDelete={() =>
                        openDeleteDialog(
                          schedule.id,
                          "control",
                          schedule.profiles?.full_name || "jadwal"
                        )
                      }
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="my-4">
            Apakah kamu yakin ingin menghapus <b>{deleteTarget?.name}</b>?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
