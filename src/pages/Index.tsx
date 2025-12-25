import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Pill,
  ClipboardList,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Pill,
      title: "Pengingat Obat",
      description: "Notifikasi otomatis untuk jadwal minum obat harian",
    },
    {
      icon: ClipboardList,
      title: "Catatan Kesehatan",
      description: "Rekam keluhan dan kondisi kesehatan setiap hari",
    },
    {
      icon: Calendar,
      title: "Jadwal Kontrol",
      description: "Pantau jadwal kontrol yang ditetapkan dokter",
    },
    {
      icon: Users,
      title: "Monitoring Pasien",
      description: "Tenaga medis dapat memantau kondisi pasien",
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 fixed gradient-hero">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">E-Health Care</span>
          </div>
          <Link to="/auth">
            <Button>Masuk</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pb-4 pt-28">
        <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Aplikasi Kesehatan Terpercaya
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Kelola Kesehatan HIV{" "}
            <span className="text-primary">Dengan Mudah</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sistem manajemen kesehatan terpadu untuk pasien HIV. Pantau jadwal
            obat, catat kondisi harian, dan tetap terhubung dengan tenaga medis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Mulai Sekarang
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div
          className="mt-20 text-center animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <Card className="max-w-2xl mx-auto gradient-card border-primary/20">
            <CardContent className="py-8">
              <Heart className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Kesehatan Anda, Prioritas Kami
              </h2>
              <p className="text-muted-foreground mb-6">
                Daftar gratis dan mulai kelola kesehatan Anda dengan lebih baik
              </p>
              <Link to="/auth">
                <Button size="lg">
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <span>E-Health Care © 2025. Universitas Esa Unggul</span>
          </div>
          <p>Aplikasi untuk mendukung penanganan HIV yang lebih baik</p>
        </div>
      </footer>
    </div>
  );
}
