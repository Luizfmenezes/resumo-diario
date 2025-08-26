import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoadServiceModalProps {
  onServiceLoaded: () => void;
}

const LoadServiceModal: React.FC<LoadServiceModalProps> = ({ onServiceLoaded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceText, setServiceText] = useState('');
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const parseServiceText = (text: string) => {
    const lines = text.split('\n');
    const services = [];
    let currentService: any = null;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.includes('🚍 LINHA:')) {
            if (currentService) {
                services.push(currentService);
            }
            const match = trimmedLine.match(/LINHA:\s*(.+?)\s*---/);
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            currentService = {
                codigo_linha: match ? match[1].trim() : '',
                data_referencia: `${year}-${month}-${day}`,
                // Inicializa todos os campos numéricos como null
                icv_tp_prog: null, icv_tp_real: null,
                icv_ts_prog: null, icv_ts_real: null,
                perdas_icv: null,
                icf_prog_pm: null, icf_prog_ep: null, icf_prog_pt: null,
                icf_real_pm: null, icf_real_ep: null, icf_real_pt: null,
                ipp_tp: null, ipp_ts: null,
                ocorrencias_sos: null
            };
        } else if (currentService) {
            if (trimmedLine.includes('- ICV TP:')) {
                const match = trimmedLine.match(/Prog\s*(\d+),\s*Real\s*(\d+)/);
                if (match) {
                    currentService.icv_tp_prog = parseInt(match[1]);
                    currentService.icv_tp_real = parseInt(match[2]);
                }
            } else if (trimmedLine.includes('- ICV TS:')) {
                const match = trimmedLine.match(/Prog\s*(\d+),\s*Real\s*(\d+)/);
                if (match) {
                    currentService.icv_ts_prog = parseInt(match[1]);
                    currentService.icv_ts_real = parseInt(match[2]);
                }
            } else if (trimmedLine.includes('- Perdas ICV:')) {
                const match = trimmedLine.match(/Perdas ICV:\s*(\d+)/);
                if (match) {
                    currentService.perdas_icv = parseInt(match[1]);
                }
            } else if (trimmedLine.includes('- ICF Prog:')) {
                const match = trimmedLine.match(/PM\((\d+)\),\s*EP\((\d+)\),\s*PT\((\d+)\)/);
                if (match) {
                    currentService.icf_prog_pm = parseInt(match[1]);
                    currentService.icf_prog_ep = parseInt(match[2]);
                    currentService.icf_prog_pt = parseInt(match[3]);
                }
            } else if (trimmedLine.includes('- ICF Real:')) {
                const match = trimmedLine.match(/PM\((\d+)\),\s*EP\((\d+)\),\s*PT\((\d+)\)/);
                if (match) {
                    currentService.icf_real_pm = parseInt(match[1]);
                    currentService.icf_real_ep = parseInt(match[2]);
                    currentService.icf_real_pt = parseInt(match[3]);
                }
            } else if (trimmedLine.includes('- IPP:')) {
                const tpMatch = trimmedLine.match(/TP\s*\((\d+)%\)/);
                const tsMatch = trimmedLine.match(/TS\s*\((\d+)%\)/);
                if (tpMatch) currentService.ipp_tp = parseInt(tpMatch[1]);
                if (tsMatch) currentService.ipp_ts = parseInt(tsMatch[1]);
            } else if (trimmedLine.includes('- S.O.S:')) {
                const match = trimmedLine.match(/S\.O\.S:\s*(\d+)/);
                if (match) {
                    currentService.ocorrencias_sos = parseInt(match[1]);
                }
            }
        }
    }

    if (currentService) {
        services.push(currentService);
    }

    return services;
  };

  const handleLoadService = async () => {
    if (!serviceText.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira o texto do serviço",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const services = parseServiceText(serviceText);
      
      if (services.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível processar o texto fornecido",
        });
        setIsLoading(false);
        return;
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const { error: deleteError } = await supabase
        .from('desempenho_linhas')
        .delete()
        .eq('data_referencia', dateString);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('desempenho_linhas')
        .insert(services);

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Sucesso",
        description: `${services.length} linhas carregadas para ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      });

      setServiceText('');
      setIsOpen(false);
      onServiceLoaded();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar serviço",
        description: error.message || "Verifique as permissões da sua tabela (RLS).",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-primary hover:shadow-glow text-white border-0 transition-all duration-300"
        >
          <Upload className="h-4 w-4 mr-2" />
          Carregar Serviço
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>Carregar Dados do Serviço</DialogTitle>
          <DialogDescription className="sr-only">
            Selecione uma data e cole o texto do serviço para carregar os dados de desempenho das linhas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data do Serviço</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      setSelectedDate(localDate);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="service-text">Texto do Serviço</Label>
            <Textarea
              id="service-text"
              placeholder="Cole aqui o texto com os dados das linhas..."
              value={serviceText}
              onChange={(e) => setServiceText(e.target.value)}
              className="min-h-[300px] sm:min-h-[400px] font-mono text-xs sm:text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleLoadService}
              disabled={isLoading}
              className="bg-gradient-primary hover:shadow-glow order-1 sm:order-2 flex-1"
            >
              {isLoading ? 'Carregando...' : 'Carregar Dados'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadServiceModal;
