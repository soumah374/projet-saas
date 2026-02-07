import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCreateProject } from '@/hooks/use-projects';
import { useContrats } from '@/hooks/use-contrats';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { CreateProjectPayload, ProjectType, ProjectPriority, Contrat } from '@/lib/types';
import { ClientAutocomplete } from '../ui/ClientAutocomplete';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  objectives: z.string().optional(),
  type: z.enum(['Externe', 'Interne'] as const),
  priority: z.enum(['Basse', 'Normale', 'Haute', 'Urgente'] as const),
  deadline: z.date({ required_error: 'Veuillez sélectionner une date limite' }),
  client: z.number({ required_error: 'Veuillez sélectionner un client' }).min(1, 'Veuillez sélectionner un client'),
  budget: z.string().optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);

  const createProject = useCreateProject();

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      objectives: '',
      type: 'Externe',
      priority: 'Normale',
      budget: '',
    },
  });

  const selectedClient = form.watch('client');
  const { data: contratsData, isLoading: contratsLoading } = useContrats({ client: selectedClient || undefined });

  const handleSubmit = async (values: CreateProjectFormValues) => {
    const projectData: CreateProjectPayload = {
      title: values.title,
      description: values.description,
      objectives: values.objectives || '',
      type: values.type as ProjectType,
      status: 'Prospection',
      priority: values.priority as ProjectPriority,
      deadline: format(values.deadline, 'yyyy-MM-dd'),
      client: values.client,
      departments: [],
      contract: selectedContrat?.id || null,
      tags: [],
      budget: values.budget ? parseFloat(values.budget) : undefined,
    };

    try {
      await createProject.mutateAsync(projectData);
      toast.success('Projet créé avec succès');
      onClose();
      onSuccess?.();
      form.reset();
      setSelectedContrat(null);
    } catch {
      // Error handled by hook's onError
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedContrat(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre du projet *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Entrez le titre du projet"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez le projet"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="objectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectifs</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Objectifs du projet"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de projet *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Externe">Externe</SelectItem>
                        <SelectItem value="Interne">Interne</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Basse">Basse</SelectItem>
                        <SelectItem value="Normale">Normale</SelectItem>
                        <SelectItem value="Haute">Haute</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <FormControl>
                    <ClientAutocomplete
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => {
                        const clientId = value ? parseInt(value) : undefined;
                        field.onChange(clientId);
                        setSelectedContrat(null);
                      }}
                      placeholder="Sélectionnez un client"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date limite *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: fr }) : "Sélectionner une date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormItem>
                  <FormLabel>Contrat (optionnel)</FormLabel>
                  <Select
                    value={selectedContrat?.id?.toString() || ''}
                    onValueChange={(value) => {
                      const contrat = contratsData?.results?.find(c => c.id.toString() === value);
                      setSelectedContrat(contrat || null);
                    }}
                    disabled={!selectedClient || contratsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedClient
                          ? "Sélectionnez d'abord un client"
                          : contratsLoading
                            ? "Chargement des contrats..."
                            : "Sélectionnez un contrat"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {contratsData?.results?.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">
                          Aucun contrat disponible pour ce client
                        </div>
                      ) : (
                        contratsData?.results?.map((contrat) => (
                          <SelectItem key={contrat.id} value={contrat.id.toString()}>
                            {contrat.numero} - {contrat.statut}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              </div>
            </div>

            {/* Budget */}
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Montant du budget"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le projet'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
