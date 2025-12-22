import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Education from "./pages/Education";
import Medications from "./pages/Medications";
import HealthLog from "./pages/HealthLog";
import LabResults from "./pages/LabResults";
import ControlSchedule from "./pages/ControlSchedule";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import ManageSchedules from "./pages/ManageSchedules";
import Staff from "./pages/Staff";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/education" element={<Education />} />
      <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/health-log" element={<ProtectedRoute><HealthLog /></ProtectedRoute>} />
      <Route path="/lab-results" element={<ProtectedRoute><LabResults /></ProtectedRoute>} />
      <Route path="/control-schedule" element={<ProtectedRoute><ControlSchedule /></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
      <Route path="/patient/:patientId" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
      <Route path="/manage-schedules" element={<ProtectedRoute><ManageSchedules /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
