import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama terlalu panjang"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = loginSchema.parse(loginForm);
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email atau password salah");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Berhasil masuk!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signupSchema.parse(signupForm);
      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.fullName
      );

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email sudah terdaftar");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Registrasi berhasil! Cek email untuk aktivasi email.");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const email = z.string().email().parse(resetEmail);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Link reset password dikirim ke email Anda");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (err) {
      toast.error("Email tidak valid");
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-slide-up">
          <CardHeader className="text-center">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Lupa Password</CardTitle>
            <CardDescription>
              Masukkan email Anda untuk menerima link reset password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary shadow-glow">
            <Heart className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">E-Health Care</h1>
          <p className="text-muted-foreground">
            Sistem Manajemen Kesehatan Terpadu
          </p>
        </div>

        <Card>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader>
                <CardTitle>Selamat Datang Kembali</CardTitle>
                <CardDescription>
                  Masuk ke akun Anda untuk melanjutkan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@contoh.com"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Memproses..." : "Masuk"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Lupa password?
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Buat Akun Baru</CardTitle>
                <CardDescription>
                  Daftar sebagai pasien untuk memulai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Nama Anda"
                        value={signupForm.fullName}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            fullName: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="email@contoh.com"
                        value={signupForm.email}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            email: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Minimal 6 karakter"
                        value={signupForm.password}
                        onChange={(e) =>
                          setSignupForm({
                            ...signupForm,
                            password: e.target.value,
                          })
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Memproses..." : "Daftar"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
