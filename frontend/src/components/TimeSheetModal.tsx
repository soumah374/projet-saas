import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProjectTasks } from '@/hooks/use-projects';
import { useCreateTimesheet, useUpdateTimesheet, useValidateTimesheet } from '@/hooks/use-timesheets';
import { TimeSheet } from '@/lib/api';
import { StyledDateInput } from './ui/DateInput';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CalendarIcon, Check } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { useCurrentUser } from '@/hooks/use-users';

interface TimeSheetModalProps {
  projectId: string;
  timeSheet?: TimeSheet;
  mode: 'create' | 'edit' | 'view';
  children: React.ReactNode;
  onClose?: () => void;
}

interface FormErrors {
  date?: string;
  hours?: string;
  task?: string;
  description?: string;
  general?: string;
}

export const TimeSheetModal = ({
  projectId,
  timeSheet,
  mode,
  children,
  onClose
}: TimeSheetModalProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(timeSheet?.date ? new Date(timeSheet.date) : new Date());
  const [hours, setHours] = useState(timeSheet?.hours?.toString() || '');
  const [taskId, setTaskId] = useState(timeSheet?.task?.toString() || '');
  const [description, setDescription] = useState(timeSheet?.description || '');
  const [errors, setErrors] = useState<FormErrors>({});

  const { toast } = useToast();
  const { data: tasksData } = useProjectTasks(projectId);
  const createTimesheet = useCreateTimesheet();
  const updateTimesheet = useUpdateTimesheet();
  const validateTimesheet = useValidateTimesheet();
  
  const tasks = tasksData?.results || [];
  const selectedTask = tasks.find(t => t.id.toString() === taskId);
  const isReadOnly = mode === 'view' || (timeSheet?.validated_by && mode === 'edit');

  const [dateTimeSheetOpen, setDateTimeSheetOpen] = useState(false);
  
  useEffect(() => {
    if (open) {
      setDate(timeSheet?.date ? new Date(timeSheet.date) : new Date());
      setHours(timeSheet?.hours?.toString() || '');
      setTaskId(timeSheet?.task?.toString() || '');
      setDescription(timeSheet?.description || '');
      setErrors({});
    }
  }, [open, timeSheet]);
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validation de la date
    if (!date) {
      newErrors.date = 'La date est requise';
    } else {
      const selectedDate = date;
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      if (selectedDate > today) {
        newErrors.date = 'La date ne peut pas être dans le futur';
      } else if (selectedDate < thirtyDaysAgo) {
        newErrors.date = 'La date ne peut pas être plus ancienne que 30 jours';
      }
    }
    
    // Validation des heures
    const hoursNum = parseFloat(hours);
    if (!hours) {
      newErrors.hours = 'Les heures sont requises';
    } else if (isNaN(hoursNum)) {
      newErrors.hours = 'Les heures doivent être un nombre';
    } else if (hoursNum <= 0) {
      newErrors.hours = 'Les heures doivent être supérieures à 0';
    } else if (hoursNum > 24) {
      newErrors.hours = 'Les heures ne peuvent pas dépasser 24';
    }
    
    // Validation de la activité
    if (!taskId) {
      newErrors.task = 'La activité est requise';
    } else if (selectedTask?.status === 'Terminé' && mode === 'create') {
      newErrors.task = 'Impossible d\'ajouter des heures à une activité terminée';
    }
    
    // Validation de la description
    if (!description.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { data: currentUser } = useCurrentUser();
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const data = {
        date: format(date!, 'yyyy-MM-dd'),
        hours: parseFloat(hours),
        task: parseInt(taskId),
        description: description.trim(),
        project: projectId,
        user: currentUser?.data?.id,
        status: 'En cours'
      };
      
      if (mode === 'create') {
        await createTimesheet.mutateAsync({
          projectId,
          data
        });
        toast({
          title: 'Feuille de temps créée',
          description: 'La feuille de temps a été créée avec succès.'
        });
      } else if (mode === 'edit' && timeSheet) {
        await updateTimesheet.mutateAsync({
          projectId,
          timesheetId: timeSheet.id,
          data
        });
        toast({
          title: 'Feuille de temps modifiée',
          description: 'La feuille de temps a été modifiée avec succès.'
        });
      }
      
      setOpen(false);
      onClose?.();
    } catch (error: any) {
      const apiErrors = error?.response?.data;
      if (apiErrors) {
        const newErrors: FormErrors = {};
        Object.entries(apiErrors).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            newErrors[key as keyof FormErrors] = value[0];
          } else if (typeof value === 'string') {
            newErrors.general = value;
          }
        });
        setErrors(newErrors);
      } else {
        setErrors({
          general: 'Une erreur est survenue lors de l\'enregistrement'
        });
      }
    }
  };
  
  const [errorValidate, setErrorValidate] = useState<string | null>(null);
  const handleValidate = async () => {
    if (!timeSheet) return;
    
    try {
      await validateTimesheet.mutateAsync({
        projectId,
        timesheetId: timeSheet.id
      });
      toast({
        title: 'Feuille de temps validée',
        description: 'La feuille de temps a été validée avec succès.'
      });
      setOpen(false);
      onClose?.();
    } catch (error: any) {
      setErrorValidate(error?.response?.data?.error);
      toast({
        title: 'Erreur',
        description: errorValidate || 'Une erreur est survenue lors de la validation',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle feuille de temps' :
             mode === 'edit' ? 'Modifier la feuille de temps' :
             'Détails de la feuille de temps'}
          </DialogTitle>
        </DialogHeader>
        
        {errors.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {timeSheet?.validated_by && (
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Validé par {timeSheet.validator_name}
              </Badge>
              <span className="text-sm text-gray-500">
                le {format(new Date(timeSheet.validated_at!), 'dd/MM/yyyy', { locale: fr })}
              </span>
            </div>
          )}

          {errorValidate && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorValidate}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover open={dateTimeSheetOpen} onOpenChange={setDateTimeSheetOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  style={{ zIndex: 9999, pointerEvents: 'auto' }}
                >
                  <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        setDate(date || undefined);
                        setDateTimeSheetOpen(false);
                      }}
                      initialFocus
                    />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="hours">Heures</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={isReadOnly}
                className={errors.hours ? 'border-red-500' : ''}
                placeholder="Saisir le nombre d'heures"
              />
              {errors.hours && (
                <span className="text-sm text-red-500">{errors.hours}</span>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="task">Activité</Label>
            <Select
              value={taskId}
              onValueChange={setTaskId}
              disabled={isReadOnly}
            >
              <SelectTrigger className={errors.task ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner une activité" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem
                    key={task.id}
                    value={task.id.toString()}
                    disabled={task.status === 'Terminé' && mode === 'create'}
                  >
                    {task.title}
                    {task.status === 'Terminé' && (
                      <span className="ml-2 text-sm text-gray-500">(Terminée)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.task && (
              <span className="text-sm text-red-500">{errors.task}</span>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isReadOnly}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <span className="text-sm text-red-500">{errors.description}</span>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            {!isReadOnly && (
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
            )}
            
            {mode === 'view' && timeSheet && !timeSheet.validated_by && (
              <Button
                onClick={handleValidate}
                disabled={validateTimesheet.isPending}
              >
                Valider
              </Button>
            )}
            
            {!isReadOnly && (
              <Button
                onClick={handleSubmit}
                disabled={createTimesheet.isPending || updateTimesheet.isPending}
              >
                {mode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 