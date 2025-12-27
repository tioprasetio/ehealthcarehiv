import { supabaseLite } from "@/lib/supabase-lite";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabaseLite.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="max-w-md w-full text-center bg-card border rounded-2xl shadow-xl p-8 space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight">
          Sedang Maintenance
        </h1>

        {/* Description */}
        <p className="text-muted-foreground">
          Kami sedang melakukan peningkatan sistem agar layanan lebih stabil dan
          aman. Silakan kembali beberapa saat lagi.
        </p>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Action */}
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition"
          >
            Logout
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Terima kasih atas kesabaran Anda 🙏
          </p>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} • System Maintenance
        </p>
      </div>
    </div>
  );
}
