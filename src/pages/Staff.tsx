import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Users, Plus, Shield, Calendar, Trash2 } from 'lucide-react';
import { z } from 'zod';

interface Staff {
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

const staffSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function Staff() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchStaff();
  }, [role, navigate]);

  const fetchStaff = async () => {
    setIsLoading(true);

    // Get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError || !adminRoles) {
      console.error(rolesError);
      setIsLoading(false);
      return;
    }

    const adminIds = adminRoles.map((r) => r.user_id);

    if (adminIds.length === 0) {
      setStaffList([]);
      setIsLoading(false);
      return;
    }

    // Get profiles for these admins
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone, created_at')
      .in('user_id', adminIds)
      .order('full_name');

    if (profilesError) {
      console.error(profilesError);
    } else {
      setStaffList(profiles || []);
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validated = staffSchema.parse(formData);

      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the role to admin
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id);

        if (roleError) throw roleError;
      }

      toast.success('Tenaga medis berhasil ditambahkan');
      setFormData({ fullName: '', email: '', password: '' });
      setIsDialogOpen(false);
      fetchStaff();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error(error);
        toast.error('Gagal menambahkan tenaga medis');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tenaga Medis</h1>
            <p className="text-muted-foreground">Kelola akun tenaga medis</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tenaga Medis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Tenaga Medis Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@contoh.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : staffList.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Tenaga Medis</h3>
              <p className="text-muted-foreground mb-4">
                Tambahkan tenaga medis pertama untuk memulai
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Sekarang
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staffList.map((staff) => (
              <Card key={staff.user_id}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-semibold">
                      {staff.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {staff.full_name}
                        {staff.user_id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Anda
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Tenaga Medis
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Bergabung {format(new Date(staff.created_at), 'd MMM yyyy', { locale: id })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
