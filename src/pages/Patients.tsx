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
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Users, Search, Eye, Phone, Calendar } from "lucide-react";

interface Patient {
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export default function Patients() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const bannerStyles = [
    "from-teal-400 to-cyan-400",
    "from-indigo-400 to-purple-400",
    "from-rose-400 to-pink-400",
    "from-amber-400 to-orange-400",
    "from-emerald-400 to-teal-500",
  ];
  const getBannerClass = (index: number) =>
    bannerStyles[index % bannerStyles.length];

  useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchPatients();
  }, [role, navigate]);

  const fetchPatients = async () => {
    setIsLoading(true);

    // Get all patient user IDs
    const { data: patientRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "patient");

    if (rolesError || !patientRoles) {
      console.error(rolesError);
      setIsLoading(false);
      return;
    }

    const patientIds = patientRoles.map((r) => r.user_id);

    if (patientIds.length === 0) {
      setPatients([]);
      setIsLoading(false);
      return;
    }

    // Get profiles for these patients
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone, created_at")
      .in("user_id", patientIds)
      .order("full_name");

    if (profilesError) {
      console.error(profilesError);
    } else {
      setPatients(profiles || []);
    }

    setIsLoading(false);
  };

  const filteredPatients = patients.filter((patient) =>
    patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Daftar Pasien
            </h1>
            <p className="text-muted-foreground">
              Kelola dan pantau data pasien
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pasien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "Pasien Tidak Ditemukan" : "Belum Ada Pasien"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Coba ubah kata kunci pencarian"
                  : "Pasien baru akan muncul setelah mendaftar"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient, index) => (
              <Card
                key={patient.user_id}
                className="overflow-hidden hover:shadow-lg transition"
              >
                {/* Banner */}
                <div
                  className={`h-32 bg-gradient-to-r ${getBannerClass(
                    index
                  )} relative`}
                >
                  {/* Pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)
                      `,
                      backgroundSize: "40px 40px",
                    }}
                  />
                </div>

                <CardContent className="space-y-3 mt-3">
                  {/* Badge */}
                  <span className="inline-block rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                    Pasien
                  </span>

                  {/* Nama */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {patient.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {patient.full_name}
                      </CardTitle>
                      {/* Meta */}
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {patient.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Terdaftar{" "}
                    {format(new Date(patient.created_at), "d MMM yyyy", {
                      locale: id,
                    })}
                  </CardDescription>

                  {/* CTA */}
                  <Button
                    className="w-full mt-2"
                    onClick={() => navigate(`/patient/${patient.user_id}`)}
                  >
                    Lihat Detail
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
