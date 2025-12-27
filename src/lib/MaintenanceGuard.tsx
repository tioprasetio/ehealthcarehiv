import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseLite } from "@/lib/supabase-lite";
import MaintenancePage from "@/pages/MaintenancePage";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // ✅ AUTH & RESET PASSWORD SELALU BOLEH
      if (
        location.pathname.startsWith("/auth") ||
        location.pathname.startsWith("/reset-password")
      ) {
        setCanAccess(true);
        setLoading(false);
        return;
      }

      // 1️⃣ Cek maintenance flag
      const { data: maintenanceData } = await supabaseLite
        .from("app_settings")
        .select("value")
        .eq("key", "maintenance")
        .single();

      const maintenanceOn = Boolean(maintenanceData?.value);

      // 2️⃣ Kalau maintenance OFF → bebas
      if (!maintenanceOn) {
        setCanAccess(true);
        setLoading(false);
        return;
      }

      // 3️⃣ Maintenance ON + belum login → BLOCK
      if (!user) {
        setCanAccess(false);
        setLoading(false);
        return;
      }

      // 4️⃣ Ambil profile
      const { data: profile } = await supabaseLite
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // 5️⃣ Super Admin bypass
      if (profile?.full_name === "Super Admin") {
        setCanAccess(true);
      } else {
        setCanAccess(false);
      }

      setLoading(false);
    };

    checkAccess();
  }, [user, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="animate-pulse text-muted-foreground">
          Memuat aplikasi...
        </span>
      </div>
    );
  }

  if (!canAccess) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
