import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { type Contrat } from '@/hooks/use-contrats';

interface EditContratModalProps {
  contrat: Contrat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
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
  isLoading?: boolean;
}

export function EditContratModal({ 
  contrat, 
  open, 
  onOpenChange, 
  onSave, 
  isLoading = false 
}: EditContratModalProps) {
  const [editForm, setEditForm] = useState({
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
  const [editDateDebut, setEditDateDebut] = useState<Date | undefined>(undefined);
  const [editDateFin, setEditDateFin] = useState<Date | undefined>(undefined);

  // Initialiser le formulaire quand le contrat change
  useEffect(() => {
    if (contrat && open) {
      setEditForm({
        date_debut: contrat.date_debut,
        date_fin: contrat.date_fin,
        conditions: contrat.conditions || '',
        notes: contrat.notes || '',
        echeancier_type: 'standard',
        nombre_echeances: 3,
        echeances: []
      });
      setEditDateDebut(new Date(contrat.date_debut));
      setEditDateFin(new Date(contrat.date_fin));
    }
  }, [contrat, open]);

  // Fonctions pour générer automatiquement les échéances
  const generateStandardEcheances = () => {
    const echeances = [
      {
        numero: 1,
        type: 'acompte' as const,
        pourcentage: 30,
        date_echeance: editForm.date_debut,
        commentaire: 'Acompte à la commande'
      },
      {
        numero: 2,
        type: 'tranche' as const,
        pourcentage: 40,
        date_echeance: editForm.date_fin,
        commentaire: 'Paiement à la livraison'
      },
      {
        numero: 3,
        type: 'solde' as const,
        pourcentage: 30,
        date_echeance: editForm.date_fin,
        commentaire: 'Solde après réception'
      }
    ];
    setEditForm({ ...editForm, echeances });
  };

  const generateTranchesEcheances = () => {
    const echeances = [];
    const pourcentageParTranche = 100 / editForm.nombre_echeances;
    
    for (let i = 1; i <= editForm.nombre_echeances; i++) {
      echeances.push({
        numero: i,
        type: i === 1 ? 'acompte' as const : 'tranche' as const,
        pourcentage: pourcentageParTranche,
        date_echeance: editForm.date_debut,
        commentaire: `Tranche ${i}`
      });
    }
    setEditForm({ ...editForm, echeances });
  };

  const updateEcheance = (index: number, field: string, value: any) => {
    const newEcheances = [...editForm.echeances];
    newEcheances[index] = { ...newEcheances[index], [field]: value };
    setEditForm({ ...editForm, echeances: newEcheances });
  };

  const addEcheance = () => {
    const newEcheance = {
      numero: editForm.echeances.length + 1,
      type: 'tranche' as const,
      pourcentage: 0,
      date_echeance: editForm.date_debut,
      commentaire: ''
    };
    setEditForm({ 
      ...editForm, 
      echeances: [...editForm.echeances, newEcheance] 
    });
  };

  const removeEcheance = (index: number) => {
    const newEcheances = editForm.echeances.filter((_, i) => i !== index);
    // Recalculer les numéros
    newEcheances.forEach((echeance, i) => {
      echeance.numero = i + 1;
    });
    setEditForm({ ...editForm, echeances: newEcheances });
  };

  // Effets pour générer automatiquement les échéances
  useEffect(() => {
    if (editForm.echeancier_type === 'standard' && editForm.date_debut && editForm.date_fin) {
      generateStandardEcheances();
    }
  }, [editForm.echeancier_type, editForm.date_debut, editForm.date_fin]);

  useEffect(() => {
    if (editForm.echeancier_type === 'tranches' && editForm.date_debut && editForm.date_fin) {
      generateTranchesEcheances();
    }
  }, [editForm.echeancier_type, editForm.nombre_echeances, editForm.date_debut, editForm.date_fin]);

  const handleSave = async () => {
    // Validation des données
    if (!editForm.date_debut || !editForm.date_fin) {
      toast.error('Les dates de début et de fin sont obligatoires');
      return;
    }

    if (new Date(editForm.date_debut) >= new Date(editForm.date_fin)) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    // Validation des échéances
    if (editForm.echeances.length > 0) {
      const totalPourcentage = editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0);
      if (totalPourcentage !== 100) {
        toast.error('Le total des pourcentages des échéances doit être égal à 100%');
        return;
      }
    }

    try {
      await onSave({
        date_debut: editForm.date_debut,
        date_fin: editForm.date_fin,
        conditions: editForm.conditions,
        notes: editForm.notes,
        echeances: editForm.echeances
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  if (!contrat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Modifier le contrat {contrat.numero}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDateDebut ? format(editDateDebut, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={editDateDebut}
                    onSelect={(date) => {
                      setEditDateDebut(date);
                      setEditForm({ ...editForm, date_debut: date ? date.toISOString().split('T')[0] : '' });
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
                    {editDateFin ? format(editDateFin, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={editDateFin}
                    onSelect={(date) => {
                      setEditDateFin(date);
                      setEditForm({ ...editForm, date_fin: date ? date.toISOString().split('T')[0] : '' });
                    }}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-conditions">Conditions</Label>
            <Textarea
              id="edit-conditions"
              value={editForm.conditions}
              onChange={(e) => setEditForm({ ...editForm, conditions: e.target.value })}
              placeholder="Conditions du contrat..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Notes du contrat..."
              rows={4}
            />
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
                  value={editForm.echeancier_type} 
                  onValueChange={(value) => setEditForm({ ...editForm, echeancier_type: value })}
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
              {editForm.echeancier_type === 'tranches' && (
                <div>
                  <Label>Nombre de tranches</Label>
                  <Select 
                    value={editForm.nombre_echeances.toString()} 
                    onValueChange={(value) => setEditForm({ ...editForm, nombre_echeances: parseInt(value) })}
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
            {editForm.echeances.length > 0 && (
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
                  {editForm.echeances.map((echeance, index) => (
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
                    <span className={`font-bold ${editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0).toFixed(2)}%
                    </span>
                  </div>
                  {editForm.echeances.reduce((sum, e) => sum + e.pourcentage, 0) !== 100 && (
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
            {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 