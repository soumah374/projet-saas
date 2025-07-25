import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatMontant } from '@/lib/formatters';
import type { Contrat } from '@/hooks/use-contrats';

interface ContratsModalsProps {
  // Modal de création
  createDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
  createForm: {
    devis_id: string;
    date_debut: string;
    date_fin: string;
    conditions: string;
    notes: string;
  };
  setCreateForm: (form: any) => void;
  dateDebut: Date | undefined;
  setDateDebut: (date: Date | undefined) => void;
  dateFin: Date | undefined;
  setDateFin: (date: Date | undefined) => void;
  devisDisponibles: any[];
  onCreateContrat: () => void;
  isCreatePending: boolean;
  
  // Modal d'édition
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
  editForm: {
    date_debut: string;
    date_fin: string;
    conditions: string;
    notes: string;
  };
  setEditForm: (form: any) => void;
  editDateDebut: Date | undefined;
  setEditDateDebut: (date: Date | undefined) => void;
  editDateFin: Date | undefined;
  setEditDateFin: (date: Date | undefined) => void;
  contratToEdit: Contrat | null;
  onUpdateContrat: () => void;
  isUpdatePending: boolean;
  
  // Modal de suppression
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  contratToDelete: Contrat | null;
  onDeleteContrat: () => void;
  isDeletePending: boolean;
}

export const ContratsModals: React.FC<ContratsModalsProps> = ({
  // Modal de création
  createDialogOpen,
  setCreateDialogOpen,
  createForm,
  setCreateForm,
  dateDebut,
  setDateDebut,
  dateFin,
  setDateFin,
  devisDisponibles,
  onCreateContrat,
  isCreatePending,
  
  // Modal d'édition
  editDialogOpen,
  setEditDialogOpen,
  editForm,
  setEditForm,
  editDateDebut,
  setEditDateDebut,
  editDateFin,
  setEditDateFin,
  contratToEdit,
  onUpdateContrat,
  isUpdatePending,
  
  // Modal de suppression
  deleteDialogOpen,
  setDeleteDialogOpen,
  contratToDelete,
  onDeleteContrat,
  isDeletePending,
}) => {
  return (
    <>
      {/* Modal de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="devis">Devis *</Label>
              <Select value={createForm.devis_id} onValueChange={(value) => setCreateForm({ ...createForm, devis_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un devis accepté" />
                </SelectTrigger>
                <SelectContent>
                  {devisDisponibles
                    .filter(devis => devis.id && devis.numero) // Filtrer les devis valides
                    .map((devis) => (
                      <SelectItem key={devis.id} value={devis.id.toString()}>
                        {devis.numero} - {devis.client || 'Client inconnu'} ({formatMontant(devis.montant_ttc || 0)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="start"
                    style={{ zIndex: 9999, pointerEvents: 'auto' }}
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
                  <PopoverContent 
                    className="w-auto p-0 z-50" 
                    align="start"  
                    style={{ zIndex: 9999, pointerEvents: 'auto' }}
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
            <div>
              <Label htmlFor="conditions">Conditions</Label>
              <Textarea
                id="conditions"
                value={createForm.conditions}
                onChange={(e) => setCreateForm({ ...createForm, conditions: e.target.value })}
                placeholder="Conditions du contrat..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="Notes du contrat..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={onCreateContrat}
              disabled={isCreatePending}
            >
              {isCreatePending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Création...
                </>
              ) : (
                'Créer le contrat'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                  <PopoverContent className="w-auto p-0 z-50" align="start">
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
                  <PopoverContent className="w-auto p-0 z-50" align="start">
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
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notes du contrat..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={onUpdateContrat}
              disabled={isUpdatePending}
            >
              {isUpdatePending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le contrat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.
            </p>
            {contratToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{contratToDelete.numero}</p>
                <p className="text-gray-600">{contratToDelete.client.nom_complet}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteContrat}
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 