import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { BookOpen, Plus, Calendar, User, Trash2, Pencil } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string | null;
}

export default function Education() {
  const { user, role } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("education_articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat artikel");
    } else {
      setArticles(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("education_articles").insert({
        title: formData.title,
        content: formData.content,
        image_url: formData.image_url || null,
        author_id: user.id,
      });

      if (error) throw error;

      toast.success("Artikel berhasil ditambahkan");
      setFormData({ title: "", content: "", image_url: "" });
      setIsDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan artikel");
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      image_url: article.image_url || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm("Yakin ingin menghapus artikel ini?")) return;

    try {
      const { error } = await supabase
        .from("education_articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;

      toast.success("Artikel berhasil dihapus");
      fetchArticles();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus artikel");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edukasi HIV</h1>
            <p className="text-muted-foreground">
              Informasi dan artikel seputar kesehatan HIV
            </p>
          </div>

          {role === "admin" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Artikel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah Artikel Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Judul artikel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Konten</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Isi artikel..."
                      rows={8}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL Gambar (opsional)</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      placeholder="https://..."
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
                    <Button type="submit">Simpan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {role === "admin" && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Artikel</DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingArticle) return;

                    const { error } = await supabase
                      .from("education_articles")
                      .update({
                        title: formData.title,
                        content: formData.content,
                        image_url: formData.image_url || null,
                      })
                      .eq("id", editingArticle.id);

                    if (error) {
                      toast.error("Gagal update artikel");
                      return;
                    }

                    toast.success("Artikel berhasil diupdate");
                    setIsEditDialogOpen(false);
                    setEditingArticle(null);
                    fetchArticles();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Konten</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      rows={8}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL Gambar</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit">Update</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Belum Ada Artikel
              </h3>
              <p className="text-muted-foreground">
                {role === "admin"
                  ? "Mulai tambahkan artikel edukasi untuk pasien"
                  : "Artikel edukasi akan muncul di sini"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
              >
                {article.image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(article.created_at), "d MMMM yyyy", {
                      locale: id,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* <p className="text-muted-foreground line-clamp-3">
                    {article.content}
                  </p> */}
                  {role === "admin" && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(article);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(article.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Article Detail Dialog */}
        <Dialog
          open={!!selectedArticle}
          onOpenChange={() => setSelectedArticle(null)}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            {selectedArticle && (
              <>
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="text-xl pr-8">
                    {selectedArticle.title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(
                      new Date(selectedArticle.created_at),
                      "d MMMM yyyy",
                      { locale: id }
                    )}
                  </p>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                  {selectedArticle.image_url && (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={selectedArticle.image_url}
                        alt={selectedArticle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground break-words">
                      {selectedArticle.content}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
