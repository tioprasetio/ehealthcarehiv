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
import { id, vi } from "date-fns/locale";
import { BookOpen, Plus, Calendar, User, Trash2, Pencil, Video } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_id: string | null;
}

interface EducationVideo {
  id: string;
  title: string;
  youtube_url: string;
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

  const [videos, setVideos] = useState<EducationVideo[]>([]);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isEditVideoDialogOpen, setIsEditVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<EducationVideo | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "article" | "video";
    title: string;
  } | null>(null);

  const [videoForm, setVideoForm] = useState({
    title: "",
    youtube_url: "",
  });

  const getYoutubeEmbedUrl = (url: string) => {
    const id = url.split("v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  };

  useEffect(() => {
    fetchArticles();
    fetchVideos();
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

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("education_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat video");
    } else {
      setVideos(data || []);
    }
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
  const handleSubmitVideoClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("education_videos").insert({
        title: videoForm.title,
        youtube_url: videoForm.youtube_url,
        author_id: user.id,
      });

      if (error) throw error;

      toast.success("Video berhasil ditambahkan");
      setVideoForm({ title: "", youtube_url: "" });
      setIsVideoDialogOpen(false);
      fetchVideos();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan video");
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

  const handleEditVideoClick = (video: EducationVideo) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      youtube_url: video.youtube_url,
    });
    setIsEditVideoDialogOpen(true);
  };

  const openDeleteDialog = (
    id: string,
    type: "article" | "video",
    title: string
  ) => {
    setItemToDelete({ id, type, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "article") {
        const { error } = await supabase
          .from("education_articles")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) throw error;
        toast.success("Artikel berhasil dihapus");
        fetchArticles();
      } else {
        const { error } = await supabase
          .from("education_videos")
          .delete()
          .eq("id", itemToDelete.id);
        if (error) throw error;
        toast.success("Video berhasil dihapus");
        fetchVideos();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus");
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
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

          {/* Tombol Tambah */}
          {role === "admin" && (
            <div className="flex gap-2 sm:justify-end">
              {/* Tambah Artikel */}
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
                          setFormData({
                            ...formData,
                            image_url: e.target.value,
                          })
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

              {/* Tambah Video */}
              <Dialog
                open={isVideoDialogOpen}
                onOpenChange={setIsVideoDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Video
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Tambah Video Edukasi</DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmitVideoClick} className="space-y-4">
                    <Input
                      placeholder="Judul video"
                      value={videoForm.title}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, title: e.target.value })
                      }
                      required
                    />

                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoForm.youtube_url}
                      onChange={(e) =>
                        setVideoForm({
                          ...videoForm,
                          youtube_url: e.target.value,
                        })
                      }
                      required
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsVideoDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit">Simpan</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Popup Edit Artikel */}
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

          {/* Popup Edit Video */}
          {role === "admin" && (
            <Dialog
              open={isEditVideoDialogOpen}
              onOpenChange={setIsEditVideoDialogOpen}
            >
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Edit Video Edukasi</DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingVideo) return;

                    const { error } = await supabase
                      .from("education_videos")
                      .update({
                        title: videoForm.title,
                        youtube_url: videoForm.youtube_url,
                      })
                      .eq("id", editingVideo.id);

                    if (error) {
                      toast.error("Gagal update video");
                      return;
                    }

                    toast.success("Video berhasil diupdate");
                    setIsEditVideoDialogOpen(false);
                    setEditingVideo(null);
                    fetchVideos();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Judul Video</Label>
                    <Input
                      value={videoForm.title}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL YouTube</Label>
                    <Input
                      value={videoForm.youtube_url}
                      onChange={(e) =>
                        setVideoForm({
                          ...videoForm,
                          youtube_url: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditVideoDialogOpen(false)}
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

        {/* Mapping Articles */}
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
                className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
                onClick={() => setSelectedArticle(article)}
              >
                {/* IMAGE WRAPPER */}
                {article.image_url && (
                  <div className="relative aspect-video overflow-hidden">
                    {/* Image */}
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* GRADIENT OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                    {/* TEXT CONTENT */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                      <h3 className="font-semibold text-base leading-tight line-clamp-2">
                        {article.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(article.created_at), "d MMMM yyyy", {
                          locale: id,
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ADMIN ACTION */}
                {role === "admin" && (
                  <CardContent>
                    <div className="flex gap-2 mt-2">
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
                          openDeleteDialog(
                            article.id,
                            "article",
                            article.title
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="my-10 border-t pt-8 space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Video Edukasi</h1>
          <p className="text-muted-foreground">Video edukasi dari YouTube</p>
        </div>

        {/* Mapping Video */}
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
        ) : videos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Belum Ada Video
              </h3>
              <p className="text-muted-foreground">
                {role === "admin"
                  ? "Mulai tambahkan video edukasi untuk pasien"
                  : "Video edukasi akan muncul di sini"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Video */}
                <div className="aspect-video bg-muted">
                  <iframe
                    src={getYoutubeEmbedUrl(video.youtube_url)}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>

                {/* Title */}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">
                    {video.title}
                  </CardTitle>
                </CardHeader>

                {/* Admin Actions */}
                {role === "admin" && (
                  <CardContent className="pt-0">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVideoClick(video);
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
                          openDeleteDialog(video.id, "video", video.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                )}
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

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus</DialogTitle>
            </DialogHeader>
            <p>
              Apakah kamu yakin ingin menghapus{" "}
              <span className="font-semibold">{itemToDelete?.title}</span>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
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
      </div>
    </DashboardLayout>
  );
}
