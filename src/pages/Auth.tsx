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
import { Heart, Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";
import { z } from "zod";
import heroImage from "@/assets/hero-doctor.jpeg";

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
  phone: z.string().regex(/^08[0-9]{8,11}$/, "No HP tidak valid"),
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
    phone: "",
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
        validated.phone,
        validated.fullName
      );

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email sudah terdaftar");
        }
        if (error.message.includes("profiles_phone_unique")) {
          toast.error("Nomor HP sudah terdaftar");
        }
        console.error("SIGNUP ERROR:", error);
        toast.error(error.message);
      } else {
        toast.success("Registrasi berhasil! Cek email untuk aktivasi email.");

        // RESET FORM
        setSignupForm({
          fullName: "",
          email: "",
          phone: "",
          password: "",
        });
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* ================= HERO ================= */}
        <div className="relative h-60 overflow-hidden rounded-b-[140px]">
          <img
            src={heroImage}
            alt="Doctor"
            className="h-full w-full object-cover"
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />

          {/* Logo */}
          <div className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow">
            <Heart className="h-5 w-5 text-teal-600" />
          </div>

          {/* Title inside hero */}
          <div className="absolute bottom-8 left-0 right-0 text-center px-6">
            <h1 className="text-2xl font-bold tracking-wide text-white">
              E-Health Care
            </h1>
            <p className="text-sm text-white/80">Sistem Manajemen Kesehatan</p>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="px-6 pt-6 pb-8">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5 bg-slate-100">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            {/* ================= LOGIN ================= */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Username"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, email: e.target.value })
                    }
                    className="pl-11 rounded-full bg-slate-100 focus:bg-white"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        password: e.target.value,
                      })
                    }
                    className="pl-11 rounded-full bg-slate-100 focus:bg-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-teal-500 hover:bg-teal-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Sign in"}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-center text-sm text-slate-500 hover:text-teal-600"
                >
                  Forgot your password?
                </button>
              </form>
            </TabsContent>

            {/* ================= SIGNUP ================= */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Nama lengkap"
                    value={signupForm.fullName}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        fullName: e.target.value,
                      })
                    }
                    className="pl-11 rounded-full bg-slate-100 focus:bg-white"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        email: e.target.value,
                      })
                    }
                    className="pl-11 rounded-full bg-slate-100 focus:bg-white"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="08xxxxxxxxxx"
                    value={signupForm.phone}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, phone: e.target.value })
                    }
                    className="pl-11 rounded-full bg-slate-100 focus:bg-white"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm({
                        ...signupForm,
                        password: e.target.value,
                      })
                    }
                    className="pl-11 rounded-full bg-slate-100 focus:bg-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full bg-teal-500 hover:bg-teal-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Daftar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
