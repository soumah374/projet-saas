import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarIcon, X, ChevronsUpDown, Plus, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/hooks/use-clients';
import { useDevisDisponibles } from '@/hooks/use-contrats';

interface Devis {
  id: number;
  numero: string;
  client: {
    id: number;
    nom_complet: string;
  };
  montant_ttc: number;
}

interface CreateContratModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    client_id: number;
    devis_ids: number[];
    devis_principal_id: number;
    date_debut: string;
    date_fin: string;
    conditions: string;
    notes: string;
    echeances: Array<{
      numero: number;
      type: 'acompte' | 'tranche' | 'solde';
      pourcentage: number;
      date_echeance: string;
      commentaire: string;
    }>;
  }) => Promise<void>;
  isLoadingDevis?: boolean;
  isLoading?: boolean;
}

export function CreateContratModal({
  open,
  onOpenChange,
  onSave,
  isLoading = false
}: CreateContratModalProps) {
  const [createForm, setCreateForm] = useState({
    client_id: null as number | null,
    devis_ids: [] as number[],
    devis_principal_id: null as number | null,
    date_debut: '',
    date_fin: '',
    conditions: '',
    notes: '',
    echeancier_type: 'standard', // 'standard', 'tranches', 'personnalise'
    nombre_echeances: 3,
    echeances: [] as Array<{
      numero: number;
      type: 'acompte' | 'tranche' | 'solde';
      pourcentage: number;
      date_echeance: string;
      commentaire: string;
    }>
  });

  // État pour gérer les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Dates pour les calendriers
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined);

  // États pour l'autocomplete des devis
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [devisSearchOpen, setDevisSearchOpen] = useState(false);

  // Hooks pour récupérer les données
  const { data: clientsData } = useClients({ page_size: 100 });
  const { data: devisDisponiblesData, isLoading: isLoadingDevisClient } = useDevisDisponibles(selectedClientId || undefined);

  const clients = clientsData?.results || [];
  const allDevisDisponibles = devisDisponiblesData || [];

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Réinitialiser les devis sélectionnés quand le client change
  useEffect(() => {
    if (selectedClientId) {
      setCreateForm(prev => ({
        ...prev,
        devis_ids: [],
        devis_principal_id: null
      }));
    }
  }, [selectedClientId]);

  const resetForm = () => {
    setCreateForm({
      client_id: null,
      devis_ids: [],
      devis_principal_id: null,
      date_debut: '',
      date_fin: '',
      conditions: '',
      notes: '',
      echeancier_type: 'standard',
      nombre_echeances: 3,
      echeances: []
    });
    setDateDebut(undefined);
    setDateFin(undefined);
    setSelectedClientId(null);
    setFieldErrors({});
  };

  // Fonction pour obtenir le devis sélectionné
  const getSelectedDevis = () => {
    return allDevisDisponibles.filter(devis => createForm.devis_ids.includes(devis.id));
  };



  // Fonctions pour générer automatiquement les échéances
  const generateStandardEcheances = () => {
    const echeances = [
      {
        numero: 1,
        type: 'acompte' as const,
        pourcentage: 30,
        date_echeance: createForm.date_debut,
        commentaire: 'Acompte à la commande'
      },
      {
        numero: 2,
        type: 'tranche' as const,
        pourcentage: 40,
        date_echeance: createForm.date_fin,
        commentaire: 'Paiement à la livraison'
      },
      {
        numero: 3,
        type: 'solde' as const,
        pourcentage: 30,
        date_echeance: createForm.date_fin,
        commentaire: 'Solde après réception'
      }
    ];
    setCreateForm({ ...createForm, echeances });
  };

  const generateTranchesEcheances = () => {
    const echeances = [];
    const pourcentageParTranche = 100 / createForm.nombre_echeances;
    
    for (let i = 1; i <= createForm.nombre_echeances; i++) {
      echeances.push({
        numero: i,
        type: i === 1 ? 'acompte' as const : 'tranche' as const,
        pourcentage: pourcentageParTranche,
        date_echeance: createForm.date_debut,
        commentaire: `Tranche ${i}`
      });
    }
    setCreateForm({ ...createForm, echeances });
  };

  const updateEcheance = (index: number, field: string, value: any) => {
    const newEcheances = [...createForm.echeances];
    newEcheances[index] = { ...newEcheances[index], [field]: value };
    setCreateForm({ ...createForm, echeances: newEcheances });
  };

  const addEcheance = () => {
    const newEcheance = {
      numero: createForm.echeances.length + 1,
      type: 'tranche' as const,
      pourcentage: 0,
      date_echeance: createForm.date_debut,
      commentaire: ''
    };
    setCreateForm({ 
      ...createForm, 
      echeances: [...createForm.echeances, newEcheance] 
    });
  };

  const removeEcheance = (index: number) => {
    const newEcheances = createForm.echeances.filter((_, i) => i !== index);
    // Recalculer les numéros
    newEcheances.forEach((echeance, i) => {
      echeance.numero = i + 1;
    });
    setCreateForm({ ...createForm, echeances: newEcheances });
  };

  // Effets pour générer automatiquement les échéances
  useEffect(() => {
    if (createForm.echeancier_type === 'standard' && createForm.date_debut && createForm.date_fin) {
      generateStandardEcheances();
    }
  }, [createForm.echeancier_type, createForm.date_debut, createForm.date_fin]);

  useEffect(() => {
    if (createForm.echeancier_type === 'tranches' && createForm.date_debut && createForm.date_fin) {
      generateTranchesEcheances();
    }
  }, [createForm.echeancier_type, createForm.nombre_echeances, createForm.date_debut, createForm.date_fin]);

  const handleSave = async () => {
    // Réinitialiser les erreurs
    const errors: Record<string, boolean> = {};

    // Validation du client
    if (!selectedClientId) {
      errors.client_id = true;
      setFieldErrors(errors);
      toast.error('Veuillez sélectionner un client');
      return;
    }

    // Validation des devis
    if (!createForm.devis_ids.length) {
      errors.devis_ids = true;
      setFieldErrors(errors);
      toast.error('Veuillez sélectionner au moins un devis');
      return;
    }

    // Validation du devis principal
    if (!createForm.devis_principal_id) {
      errors.devis_principal_id = true;
      setFieldErrors(errors);
      toast.error('Veuillez sélectionner un devis principal');
      return;
    }

    // Validation des dates
    if (!createForm.date_debut) errors.date_debut = true;
    if (!createForm.date_fin) errors.date_fin = true;

    if (errors.date_debut || errors.date_fin) {
      setFieldErrors(errors);
      toast.error('Veuillez sélectionner les dates de début et de fin');
      return;
    }

    // Validation de la cohérence des dates
    if (new Date(createForm.date_fin) <= new Date(createForm.date_debut)) {
      errors.date_fin = true;
      setFieldErrors(errors);
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    // Validation des échéances (obligatoire)
    if (createForm.echeances.length === 0) {
      errors.echeances = true;
      setFieldErrors(errors);
      toast.error('Veuillez créer au moins une échéance de paiement');
      return;
    }

    // Validation du total des pourcentages
    const totalPourcentage = createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0);
    if (Math.abs(totalPourcentage - 100) > 0.01) {
      errors.echeances = true;
      setFieldErrors(errors);
      toast.error('Le total des pourcentages des échéances doit être égal à 100%');
      return;
    }

    try {
      await onSave({
        client_id: selectedClientId,
        devis_ids: createForm.devis_ids,
        devis_principal_id: createForm.devis_principal_id,
        date_debut: createForm.date_debut,
        date_fin: createForm.date_fin,
        conditions: createForm.conditions,
        notes: createForm.notes,
        echeances: createForm.echeances
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la création du contrat:', error);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setFieldErrors({});
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Créer un nouveau contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
            {/* Sélection du client et des devis */}
            <div className="space-y-4">
              {/* Sélection du client */}
              <div className="space-y-2">
                <Label>Client *</Label>
                <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className={`w-full h-10 justify-between ${fieldErrors.client_id ? 'border-red-500' : ''}`}
                    >
                      {selectedClientId ? (
                        clients.find(client => client.id === selectedClientId)?.nom_complet || "Client sélectionné"
                      ) : (
                        "Sélectionner un client..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un client..." />
                      <CommandList>
                        <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={`${client.nom_complet} ${client.email}`}
                              onSelect={() => {
                                setSelectedClientId(client.id);
                                setCreateForm({ ...createForm, client_id: client.id });
                                setClientSearchOpen(false);
                                // Réinitialiser l'erreur du champ client
                                if (fieldErrors.client_id) {
                                  setFieldErrors(prev => ({ ...prev, client_id: false }));
                                }
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{client.nom_complet}</span>
                                <span className="text-sm text-gray-600">{client.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {fieldErrors.client_id && (
                  <p className="text-sm text-red-600 mt-1">Ce champ est obligatoire</p>
                )}
              </div>

              {/* Sélection des devis */}
              {selectedClientId && (
                <div className="space-y-2">
                  <Label>Devis du client *</Label>
                  <Popover open={devisSearchOpen} onOpenChange={setDevisSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={devisSearchOpen}
                        className={`w-full h-10 justify-between ${fieldErrors.devis_ids ? 'border-red-500' : ''}`}
                        disabled={isLoadingDevisClient}
                      >
                        {isLoadingDevisClient
                          ? "Chargement des devis..."
                          : createForm.devis_ids.length > 0
                            ? `${createForm.devis_ids.length} devis sélectionné(s)`
                            : "Sélectionner les devis..."
                        }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher des devis..." />
                        <CommandList>
                          {isLoadingDevisClient ? (
                            <CommandEmpty>Chargement des devis...</CommandEmpty>
                          ) : allDevisDisponibles.length === 0 ? (
                            <CommandEmpty>Aucun devis disponible pour ce client.</CommandEmpty>
                          ) : (
                            <CommandEmpty>Aucun devis trouvé.</CommandEmpty>
                          )}
                          <CommandGroup>
                            {allDevisDisponibles.map((devis) => (
                                <CommandItem
                                  key={devis.id}
                                  value={`${devis.numero} ${devis.client.nom_complet}`}
                                  onSelect={() => {
                                    const isSelected = createForm.devis_ids.includes(devis.id);
                                    if (isSelected) {
                                      // Retirer le devis
                                      const newDevisIds = createForm.devis_ids.filter(id => id !== devis.id);
                                      setCreateForm({
                                        ...createForm,
                                        devis_ids: newDevisIds,
                                        devis_principal_id: createForm.devis_principal_id === devis.id ? null : createForm.devis_principal_id
                                      });
                                    } else {
                                      // Ajouter le devis
                                      const newDevisIds = [...createForm.devis_ids, devis.id];
                                      setCreateForm({
                                        ...createForm,
                                        devis_ids: newDevisIds,
                                        devis_principal_id: createForm.devis_principal_id || devis.id
                                      });
                                      // Réinitialiser l'erreur du champ devis
                                      if (fieldErrors.devis_ids) {
                                        setFieldErrors(prev => ({ ...prev, devis_ids: false }));
                                      }
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{devis.numero}</span>
                                      <span className="text-sm text-gray-600">{formatMontant(devis.montant_ttc)}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={createForm.devis_ids.includes(devis.id)}
                                      onChange={() => {}} // Géré par onSelect
                                      className="ml-2"
                                    />
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.devis_ids && (
                    <p className="text-sm text-red-600 mt-1">Veuillez sélectionner au moins un devis</p>
                  )}
                </div>
              )}

              {/* Sélection du devis principal */}
              {createForm.devis_ids.length > 0 && (
                <div className="space-y-2">
                  <Label>Devis principal *</Label>
                  <Select
                    value={createForm.devis_principal_id?.toString() || ''}
                    onValueChange={(value) => {
                      setCreateForm({ ...createForm, devis_principal_id: parseInt(value) });
                      // Réinitialiser l'erreur du champ devis_principal_id
                      if (fieldErrors.devis_principal_id) {
                        setFieldErrors(prev => ({ ...prev, devis_principal_id: false }));
                      }
                    }}
                  >
                    <SelectTrigger className={fieldErrors.devis_principal_id ? 'border-red-500 focus:ring-red-500' : ''}>
                      <SelectValue placeholder="Sélectionner le devis principal" />
                    </SelectTrigger>
                    <SelectContent>
                      {createForm.devis_ids.map(devisId => {
                        const devis = allDevisDisponibles.find(d => d.id === devisId);
                        return devis ? (
                          <SelectItem key={devisId} value={devisId.toString()}>
                            {devis.numero} - {formatMontant(devis.montant_ttc)}
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                  {fieldErrors.devis_principal_id && (
                    <p className="text-sm text-red-600 mt-1">Ce champ est obligatoire</p>
                  )}
                </div>
              )}

              {/* Affichage des devis sélectionnés */}
              {createForm.devis_ids.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Devis sélectionnés ({createForm.devis_ids.length})</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {getSelectedDevis().map((devis) => (
                      <Card key={devis.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{devis.numero}</div>
                            <div className="text-sm text-gray-600">{devis.client.nom_complet}</div>
                            <div className="text-sm text-gray-500">{formatMontant(devis.montant_ttc)}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {createForm.devis_principal_id === devis.id && (
                              <Badge variant="secondary" className="text-xs">Principal</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCreateForm({
                                  ...createForm,
                                  devis_ids: createForm.devis_ids.filter(id => id !== devis.id),
                                  devis_principal_id: createForm.devis_principal_id === devis.id ? null : createForm.devis_principal_id
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full h-10 justify-start text-left font-normal ${fieldErrors.date_debut ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateDebut ? format(dateDebut, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={dateDebut}
                      onSelect={(date) => {
                        setDateDebut(date);
                        setCreateForm({ ...createForm, date_debut: date ? date.toISOString().split('T')[0] : '' });
                        // Réinitialiser l'erreur du champ date_debut
                        if (fieldErrors.date_debut) {
                          setFieldErrors(prev => ({ ...prev, date_debut: false }));
                        }
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                {fieldErrors.date_debut && (
                  <p className="text-sm text-red-600 mt-1">Ce champ est obligatoire</p>
                )}
              </div>
              <div>
                <Label>Date de fin *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full h-10 justify-start text-left font-normal ${fieldErrors.date_fin ? 'border-red-500' : ''}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFin ? format(dateFin, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <Calendar
                      mode="single"
                      selected={dateFin}
                      onSelect={(date) => {
                        setDateFin(date);
                        setCreateForm({ ...createForm, date_fin: date ? date.toISOString().split('T')[0] : '' });
                        // Réinitialiser l'erreur du champ date_fin
                        if (fieldErrors.date_fin) {
                          setFieldErrors(prev => ({ ...prev, date_fin: false }));
                        }
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                {fieldErrors.date_fin && (
                  <p className="text-sm text-red-600 mt-1">Ce champ est obligatoire</p>
                )}
              </div>
            </div>

            {/* Conditions et notes */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="create-conditions">Conditions</Label>
                <Textarea
                  id="create-conditions"
                  value={createForm.conditions}
                  onChange={(e) => setCreateForm({ ...createForm, conditions: e.target.value })}
                  placeholder="Conditions du contrat..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="create-notes">Notes</Label>
                <Textarea
                  id="create-notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Notes du contrat..."
                  rows={3}
                />
              </div>
            </div>

            {/* Section Échéanciers */}
            <div className={`space-y-4 p-4 rounded-lg border-2 ${fieldErrors.echeances ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Échéancier de paiement *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      generateStandardEcheances();
                      // Réinitialiser l'erreur des échéances
                      if (fieldErrors.echeances) {
                        setFieldErrors(prev => ({ ...prev, echeances: false }));
                      }
                    }}
                  >
                    Standard (30-40-30)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      generateTranchesEcheances();
                      // Réinitialiser l'erreur des échéances
                      if (fieldErrors.echeances) {
                        setFieldErrors(prev => ({ ...prev, echeances: false }));
                      }
                    }}
                  >
                    Tranches égales
                  </Button>
                </div>
              </div>
              {fieldErrors.echeances && createForm.echeances.length === 0 && (
                <p className="text-sm text-red-600">Veuillez créer au moins une échéance de paiement</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type d'échéancier</Label>
                  <Select 
                    value={createForm.echeancier_type} 
                    onValueChange={(value) => setCreateForm({ ...createForm, echeancier_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (30-40-30)</SelectItem>
                      <SelectItem value="tranches">Tranches égales</SelectItem>
                      <SelectItem value="personnalise">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createForm.echeancier_type === 'tranches' && (
                  <div>
                    <Label>Nombre de tranches</Label>
                    <Select 
                      value={createForm.nombre_echeances.toString()} 
                      onValueChange={(value) => setCreateForm({ ...createForm, nombre_echeances: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 tranches</SelectItem>
                        <SelectItem value="3">3 tranches</SelectItem>
                        <SelectItem value="4">4 tranches</SelectItem>
                        <SelectItem value="5">5 tranches</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Message d'aide si aucune échéance */}
              {createForm.echeances.length === 0 && !fieldErrors.echeances && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 Cliquez sur "Standard (30-40-30)" ou "Tranches égales" pour générer automatiquement un échéancier,
                    ou sélectionnez "Personnalisé" pour créer vos propres échéances.
                  </p>
                </div>
              )}

              {/* Liste des échéances */}
              {createForm.echeances.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Échéances</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addEcheance();
                        // Réinitialiser l'erreur des échéances
                        if (fieldErrors.echeances) {
                          setFieldErrors(prev => ({ ...prev, echeances: false }));
                        }
                      }}
                    >
                      Ajouter une échéance
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {createForm.echeances.map((echeance, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Échéance {echeance.numero}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEcheance(index)}
                            className="text-red-500"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Type</Label>
                            <Select 
                              value={echeance.type} 
                              onValueChange={(value) => updateEcheance(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="acompte">Acompte</SelectItem>
                                <SelectItem value="tranche">Tranche</SelectItem>
                                <SelectItem value="solde">Solde</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Pourcentage (%)</Label>
                            <Input
                              type="number"
                              value={echeance.pourcentage}
                              onChange={(e) => updateEcheance(index, 'pourcentage', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Date d'échéance</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-10 justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {echeance.date_echeance ? format(new Date(echeance.date_echeance), "PPP", { locale: fr }) : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-auto p-0" 
                              align="start"
                              side="bottom"
                              sideOffset={4}
                            >
                              <Calendar
                                mode="single"
                                selected={echeance.date_echeance ? new Date(echeance.date_echeance) : undefined}
                                onSelect={(date) => updateEcheance(index, 'date_echeance', date ? date.toISOString().split('T')[0] : '')}
                                initialFocus
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label>Commentaire</Label>
                          <Input
                            value={echeance.commentaire}
                            onChange={(e) => updateEcheance(index, 'commentaire', e.target.value)}
                            placeholder="Commentaire optionnel..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Résumé des pourcentages */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total des pourcentages :</span>
                      <span className={`font-bold ${createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0).toFixed(2)}%
                      </span>
                    </div>
                    {createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) !== 100 && (
                      <p className="text-sm text-red-600 mt-1">
                        Le total doit être égal à 100%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Création...' : 'Créer le contrat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 