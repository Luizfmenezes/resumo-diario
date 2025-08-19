-- Create the performance data table for bus lines
CREATE TABLE public.desempenho_linhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_referencia DATE NOT NULL,
  codigo_linha TEXT NOT NULL,
  icv_tp_prog INTEGER,
  icv_tp_real INTEGER,
  icv_ts_prog INTEGER,
  icv_ts_real INTEGER,
  perdas_icv INTEGER,
  icf_prog_pm INTEGER,
  icf_prog_ep INTEGER,
  icf_prog_pt INTEGER,
  icf_real_pm INTEGER,
  icf_real_ep INTEGER,
  icf_real_pt INTEGER,
  ipp_tp INTEGER, -- Stored as number (e.g. 81 for 81%)
  ipp_ts INTEGER, -- Stored as number (e.g. 76 for 76%)
  ocorrencias_sos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.desempenho_linhas ENABLE ROW LEVEL SECURITY;

-- Create policies - authenticated users can read all data
CREATE POLICY "Authenticated users can view performance data" 
ON public.desempenho_linhas 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete data (you can modify this later)
CREATE POLICY "Only authenticated users can insert performance data" 
ON public.desempenho_linhas 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update performance data" 
ON public.desempenho_linhas 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_desempenho_linhas_updated_at
BEFORE UPDATE ON public.desempenho_linhas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on common queries
CREATE INDEX idx_desempenho_linhas_data_linha ON public.desempenho_linhas(data_referencia, codigo_linha);

-- Insert sample data for testing
INSERT INTO public.desempenho_linhas (
  data_referencia, codigo_linha, icv_tp_prog, icv_tp_real, icv_ts_prog, icv_ts_real,
  perdas_icv, icf_prog_pm, icf_prog_ep, icf_prog_pt, icf_real_pm, icf_real_ep, icf_real_pt,
  ipp_tp, ipp_ts, ocorrencias_sos
) VALUES 
  ('2025-01-19', '1017-10', 45, 42, 38, 35, 3, 15, 12, 18, 14, 11, 17, 81, 76, 2),
  ('2025-01-19', '1020-10', 52, 48, 41, 39, 4, 18, 15, 22, 16, 14, 20, 85, 79, 1),
  ('2025-01-19', '1024-10', 38, 35, 32, 30, 3, 12, 10, 15, 11, 9, 14, 78, 73, 3),
  ('2025-01-18', '1017-10', 44, 41, 37, 34, 3, 14, 11, 17, 13, 10, 16, 79, 74, 2),
  ('2025-01-18', '1025-10', 48, 45, 40, 38, 3, 16, 13, 19, 15, 12, 18, 82, 77, 1);