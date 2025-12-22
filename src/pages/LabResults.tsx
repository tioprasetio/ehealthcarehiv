import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Image, Upload, Calendar, Trash2, Eye, Loader2 } from 'lucide-react';

interface LabResult {
  id: string;
  image_url: string;
  description: string | null;
  test_date: string;
  created_at: string;
}

export default function LabResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<LabResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    description: '',
    test_date: format(new Date(), 'yyyy-MM-dd'),
    file: null as File | null,
  });

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('patient_id', user.id)
      .order('test_date', { ascending: false });

    if (error) {
      toast.error('Gagal memuat hasil lab');
    } else {
      setResults(data || []);
    }
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format file harus JPG, PNG, atau WEBP");
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.file) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lab-results')
        .upload(fileName, formData.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lab-results')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('lab_results').insert({
        patient_id: user.id,
        image_url: publicUrl,
        description: formData.description || null,
        test_date: formData.test_date,
      });

      if (insertError) throw insertError;

      toast.success('Hasil lab berhasil diupload');
      setFormData({
        description: '',
        test_date: format(new Date(), 'yyyy-MM-dd'),
        file: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsDialogOpen(false);
      fetchResults();
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengupload hasil lab');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resultId: string, imageUrl: string) => {
    if (!confirm('Yakin ingin menghapus hasil lab ini?')) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      await supabase.storage.from('lab-results').remove([filePath]);

      const { error } = await supabase
        .from('lab_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      toast.success('Hasil lab berhasil dihapus');
      fetchResults();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus hasil lab');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hasil Laboratorium
            </h1>
            <p className="text-muted-foreground">
              Upload dan kelola hasil lab Anda
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Hasil Lab
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Hasil Lab Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Foto Hasil Lab</Label>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maksimal 5MB | Format file harus JPG, PNG, atau WEBP
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_date">Tanggal Tes</Label>
                  <Input
                    id="test_date"
                    type="date"
                    value={formData.test_date}
                    onChange={(e) =>
                      setFormData({ ...formData, test_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Keterangan (opsional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Jenis pemeriksaan, catatan, dll..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Belum Ada Hasil Lab
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload foto hasil laboratorium Anda untuk dipantau tenaga medis
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Sekarang
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <Card key={result.id} className="overflow-hidden group">
                <div
                  className="aspect-square bg-muted relative cursor-pointer"
                  onClick={() => setSelectedImage(result.image_url)}
                >
                  <img
                    src={result.image_url}
                    alt="Hasil lab"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(new Date(result.test_date), "d MMMM yyyy", {
                        locale: id,
                      })}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(result.id, result.image_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {result.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Hasil lab"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
