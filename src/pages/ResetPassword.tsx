/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 🔑 WAJIB: pastikan session recovery ada
  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!data.session) {
        setError("Link reset password tidak valid atau sudah kadaluarsa.");
      }
    };

    checkRecoverySession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Password tidak cocok",
        description: "Password dan konfirmasi harus sama.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password terlalu pendek",
        description: "Minimal 6 karakter.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Password berhasil diubah",
        description: "Silakan login kembali.",
      });

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Gagal reset password",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUCCESS STATE
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-xl font-semibold mb-2">
              Password Berhasil Diubah
            </h2>
            <p className="text-muted-foreground">
              Mengalihkan ke halaman login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <Lock className="mx-auto mb-4 h-8 w-8 text-destructive" />
            <p className="mb-4">{error}</p>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Kembali ke Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔐 FORM
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Lock className="mx-auto mb-2 h-8 w-8 text-primary" />
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Masukkan password baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label>Password Baru</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Konfirmasi Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
