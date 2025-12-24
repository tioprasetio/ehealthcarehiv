-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'patient');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  UNIQUE (user_id, role)
);

CREATE UNIQUE INDEX profiles_phone_unique
ON public.profiles (phone)
WHERE phone IS NOT NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT phone_format_check
CHECK (
  phone IS NULL
  OR phone ~ '^08[0-9]{8,11}$'
);

-- Create education_articles table (blog/edukasi)
CREATE TABLE public.education_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_schedules table
CREATE TABLE public.medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  schedule_time TIME NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_logs table (tracking when patient takes medication)
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.medication_schedules(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create control_schedules table (jadwal kontrol)
CREATE TABLE public.control_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hubungkan medication_schedules ke profiles
ALTER TABLE public.medication_schedules
ADD CONSTRAINT medication_patient_profile_fk
FOREIGN KEY (patient_id)
REFERENCES public.profiles(user_id);

-- Hubungkan control_schedules ke profiles
ALTER TABLE public.control_schedules
ADD CONSTRAINT control_patient_profile_fk
FOREIGN KEY (patient_id)
REFERENCES public.profiles(user_id);

-- Create daily_health_logs table
CREATE TABLE public.daily_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  has_nausea BOOLEAN DEFAULT false,
  has_dizziness BOOLEAN DEFAULT false,
  has_weakness BOOLEAN DEFAULT false,
  has_skin_rash BOOLEAN DEFAULT false,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, log_date)
);

-- Create lab_results table
CREATE TABLE public.lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education_videos table
CREATE TABLE public.education_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.education_videos ENABLE ROW LEVEL SECURITY;

-- Public read (pasien bisa lihat)
CREATE POLICY "Anyone can read videos"
  ON public.education_videos FOR SELECT
  USING (true);

-- Admin manage
CREATE POLICY "Admins can manage videos"
  ON public.education_videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_education_videos_updated_at
  BEFORE UPDATE ON public.education_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Log untuk debugging
  RAISE NOTICE 'Creating profile for user: %', NEW.id;
  RAISE NOTICE 'Metadata: %', NEW.raw_user_meta_data;
  
  -- ambil role dari metadata, default patient
  user_role := COALESCE(
    NEW.raw_user_meta_data ->> 'role',
    'patient'
  );

  BEGIN
    INSERT INTO public.profiles (
      user_id,
      full_name,
      phone
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      NEW.raw_user_meta_data ->> 'phone'
    );
    
    RAISE NOTICE 'Profile created successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RAISE;
  END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::app_role);
    
    RAISE NOTICE 'Role created successfully: %', user_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating role: %', SQLERRM;
    RAISE;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_articles_updated_at
  BEFORE UPDATE ON public.education_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_schedules_updated_at
  BEFORE UPDATE ON public.medication_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for education_articles (public read)
CREATE POLICY "Anyone can read articles"
  ON public.education_articles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage articles"
  ON public.education_articles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for medication_schedules
CREATE POLICY "Patients can view own schedules"
  ON public.medication_schedules FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can manage all schedules"
  ON public.medication_schedules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for medication_logs
CREATE POLICY "Patients can manage own logs"
  ON public.medication_logs FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can view all logs"
  ON public.medication_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for control_schedules
CREATE POLICY "Patients can view own control schedules"
  ON public.control_schedules FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can manage all control schedules"
  ON public.control_schedules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for daily_health_logs
CREATE POLICY "Patients can manage own health logs"
  ON public.daily_health_logs FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can view all health logs"
  ON public.daily_health_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lab_results
CREATE POLICY "Patients can manage own lab results"
  ON public.lab_results FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Admins can view all lab results"
  ON public.lab_results FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for lab results
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-results', 'lab-results', true);

-- Storage policies
CREATE POLICY "Patients can upload own lab results"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lab-results' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Patients can view own lab results"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-results' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all lab results"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-results' AND public.has_role(auth.uid(), 'admin'::app_role));