import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoadedDatesManagerProps {
  onDatesChanged: () => void;
}

interface DateInfo {
  data_referencia: string;
  linha_count: number;
}

const LoadedDatesManager: React.FC<LoadedDatesManagerProps> = ({ onDatesChanged }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedDates, setLoadedDates] = useState<DateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchLoadedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('desempenho_linhas')
        .select('data_referencia')
        .order('data_referencia', { ascending: false });

      if (error) throw error;

      // Group by date and count lines
      const dateMap = new Map<string, number>();
      data?.forEach((item) => {
        const date = item.data_referencia;
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      });

      const dates: DateInfo[] = Array.from(dateMap.entries()).map(([date, count]) => ({
        data_referencia: date,
        linha_count: count
      }));

      setLoadedDates(dates);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar datas",
      });
    }
  };

  const handleDeleteDate = async (date: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('desempenho_linhas')
        .delete()
        .eq('data_referencia', date);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Dados de ${format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} removidos`,
      });

      await fetchLoadedDates();
      onDatesChanged();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao remover dados",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLoadedDates();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="border-primary/20 hover:bg-primary/10"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Gerenciar Datas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-md max-h-[80vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>Datas Carregadas</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {loadedDates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground text-sm">
                  Nenhuma data carregada ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            loadedDates.map((dateInfo) => (
              <Card key={dateInfo.data_referencia} className="hover:shadow-md transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {format(new Date(dateInfo.data_referencia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {dateInfo.linha_count} linha{dateInfo.linha_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDate(dateInfo.data_referencia)}
                      disabled={isLoading}
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadedDatesManager;