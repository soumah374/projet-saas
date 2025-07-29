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
import { CalendarIcon, X, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';

interface Devis {
  id: number;
  numero: string;
  client: {
    nom_complet: string;
  };
  montant_ttc: number;
}

interface CreateContratModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    devis_id: number;
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
  devisDisponibles: Devis[];
  isLoadingDevis?: boolean;
  isLoading?: boolean;
}

export function CreateContratModal({ 
  open, 
  onOpenChange, 
  onSave, 
  devisDisponibles, 
  isLoadingDevis = false,
  isLoading = false 
}: CreateContratModalProps) {
  const [createForm, setCreateForm] = useState({
    devis_id: '',
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
  
  // Dates pour les calendriers
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined);

  // États pour l'autocomplete des devis
  const [devisSearchOpen, setDevisSearchOpen] = useState(false);
  const [devisSearchValue, setDevisSearchValue] = useState('');

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCreateForm({
      devis_id: '',
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
    setDevisSearchValue('');
  };

  // Fonction pour obtenir le devis sélectionné
  const getSelectedDevis = () => {
    if (!createForm.devis_id) return null;
    return devisDisponibles.find(devis => devis.id.toString() === createForm.devis_id);
  };

  const selectedDevis = getSelectedDevis();

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
    if (!createForm.devis_id || !createForm.date_debut || !createForm.date_fin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation des échéances
    if (createForm.echeances.length > 0) {
      const totalPourcentage = createForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0);
      if (totalPourcentage !== 100) {
        toast.error('Le total des pourcentages des échéances doit être égal à 100%');
        return;
      }
    }

    try {
      await onSave({
        devis_id: parseInt(createForm.devis_id),
        date_debut: createForm.date_debut,
        date_fin: createForm.date_fin,
        conditions: createForm.conditions,
        notes: createForm.notes,
        echeances: createForm.echeances
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Créer un nouveau contrat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
          {/* Sélection du devis */}
          <div>
            <Label>Devis *</Label>
            <Popover open={devisSearchOpen} onOpenChange={setDevisSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={devisSearchOpen}
                  className="w-full justify-between"
                  disabled={isLoadingDevis}
                >
                  {selectedDevis ? (
                    <>
                      {selectedDevis.numero} - {selectedDevis.client.nom_complet}
                    </>
                  ) : (
                    "Sélectionner un devis..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un devis..." />
                  <CommandList>
                    <CommandEmpty>Aucun devis trouvé.</CommandEmpty>
                    <CommandGroup>
                      {devisDisponibles.map((devis) => (
                        <CommandItem
                          key={devis.id}
                          value={`${devis.numero} ${devis.client.nom_complet}`}
                          onSelect={() => {
                            setCreateForm({ ...createForm, devis_id: devis.id.toString() });
                            setDevisSearchOpen(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{devis.numero}</span>
                            <span className="text-sm text-gray-600">{devis.client.nom_complet}</span>
                            <span className="text-sm text-gray-500">{formatMontant(devis.montant_ttc)}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Date de fin *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Échéancier de paiement</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateStandardEcheances}
                >
                  Standard (30-40-30)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateTranchesEcheances}
                >
                  Tranches égales
                </Button>
              </div>
            </div>

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

            {/* Liste des échéances */}
            {createForm.echeances.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Échéances</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEcheance}
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
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
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
  );
} 