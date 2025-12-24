/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setEmail(user.email || "");

    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setFullName(data.full_name);
        setPhone(data.phone || "");
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: phone })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // update email / password
      if (email !== user.email || password) {
        const { error: authError } = await supabase.auth.updateUser({
          email,
          password: password || undefined,
        });

        if (authError) throw authError;
        await supabase.auth.signOut();
      }

      toast.success("Profil berhasil diperbarui");
      setPassword("");
    } catch (err: any) {
      if (err.code === "23505") {
        toast.error("Nomor HP sudah digunakan oleh akun lain");
        return;
      }

      if (err.code === "23514") {
        toast.error("Format nomor HP tidak valid. Gunakan 08xxxxxxxx");
        return;
      }

      toast.error(err.message || "Gagal update profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Edit Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nama Lengkap</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <Label>No HP</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <Label>Password Baru (opsional)</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ganti"
            />
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
