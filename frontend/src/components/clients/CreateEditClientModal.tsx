import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { clientCategoriesAPI } from '@/lib/api';
import type { ClientProfile, ClientCreateData } from '@/hooks/use-clients';
import type { ClientCategory, PaginatedResponse } from '@/lib/types';

interface CreateEditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientProfile | null;
  onSave: (data: ClientCreateData) => Promise<void>;
  isPending: boolean;
}

export function CreateEditClientModal({
  open,
  onOpenChange,
  client,
  onSave,
  isPending
}: CreateEditClientModalProps) {
  const [form, setForm] = useState<any>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    type_client: 'personne_physique',
    statut_commercial: 'prospect',
    raison_sociale: '',
    rccm_nif: '',
    contact: '',
    adresse_complete: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: '',
    is_active: true,
    category: null,
  });

  // Hook pour récupérer les catégories de clients
  const { data: categoriesData } = useQuery({
    queryKey: ['client-categories'],
    queryFn: async () => {
      const response = await clientCategoriesAPI.getCategories();
      return response.data as PaginatedResponse<ClientCategory>;
    },
  });
  const categories = categoriesData?.results || [];

  // Initialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (client) {
      setForm({
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        type_client: client.type_client,
        statut_commercial: client.statut_commercial,
        raison_sociale: client.raison_sociale || '',
        rccm_nif: client.rccm_nif || '',
        contact: client.contact || '',
        adresse_complete: client.adresse_complete || '',
        adresse: client.adresse,
        ville: client.ville,
        code_postal: client.code_postal,
        pays: client.pays,
        is_active: client.is_active,
        category: client.category || null,
      });
    } else {
      setForm({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        type_client: 'personne_physique',
        statut_commercial: 'prospect',
        raison_sociale: '',
        rccm_nif: '',
        contact: '',
        adresse_complete: '',
        adresse: '',
        ville: '',
        code_postal: '',
        pays: '',
        is_active: true,
        category: null,
      });
    }
  }, [client, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string | number | null) => {
    setForm({ ...form, [name]: value });
    // Si le type client change vers personne physique, vider les champs entreprise
    if (name === 'type_client' && value === 'personne_physique') {
      setForm(prev => ({
        ...prev,
        [name]: value,
        raison_sociale: '',
        rccm_nif: '',
        category: null,
      }));
    }
    // Si le type client change vers personne morale, vider la catégorie
    if (name === 'type_client' && value === 'personne_morale') {
      setForm(prev => ({
        ...prev,
        [name]: value,
        category: null,
      }));
    }
  };

  const handleSave = async () => {
    const payload: ClientCreateData = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      telephone: form.telephone,
      type_client: form.type_client,
      statut_commercial: form.statut_commercial,
      raison_sociale: form.type_client === 'personne_morale' ? form.raison_sociale : undefined,
      rccm_nif: form.type_client === 'personne_morale' ? form.rccm_nif : undefined,
      contact: form.contact,
      adresse_complete: form.adresse_complete,
      adresse: form.adresse,
      ville: form.ville,
      code_postal: form.code_postal,
      pays: form.pays,
      is_active: form.is_active,
      category: form.type_client === 'personne_morale' ? form.category : null,
    };
    
    await onSave(payload);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? 'Modifier' : 'Ajouter'} un client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Prénom</Label>
              <Input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} required />
            </div>
            <div>
              <Label className="text-sm font-medium">Nom</Label>
              <Input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label className="text-sm font-medium">Téléphone</Label>
              <Input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Type client</Label>
              <Select value={form.type_client} onValueChange={(value) => handleSelectChange('type_client', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personne_physique">Personne physique</SelectItem>
                  <SelectItem value="personne_morale">Personne morale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Statut commercial</Label>
              <Select value={form.statut_commercial} onValueChange={(value) => handleSelectChange('statut_commercial', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                  <SelectItem value="bloque">Bloqué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Catégorie pour personne morale uniquement */}
          {form.type_client === 'personne_morale' && (
            <div>
              <Label className="text-sm font-medium">Catégorie de client</Label>
              <Select 
                value={form.category?.toString() || 'none'} 
                onValueChange={(value) => handleSelectChange('category', value === 'none' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune catégorie</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Champs pour personne morale */}
          {form.type_client === 'personne_morale' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Informations entreprise</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Raison sociale</Label>
                  <Input name="raison_sociale" placeholder="Raison sociale" value={form.raison_sociale} onChange={handleChange} />
                </div>
                <div>
                  <Label className="text-sm font-medium">RCCM ou NIF</Label>
                  <Input name="rccm_nif" placeholder="RCCM ou NIF" value={form.rccm_nif} onChange={handleChange} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Contact</Label>
                <Input name="contact" placeholder="Contact" value={form.contact} onChange={handleChange} />
              </div>
            </div>
          )}

          {/* Adresse */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Adresse</h4>
            <div>
              <Label className="text-sm font-medium">Adresse complète</Label>
              <Textarea name="adresse_complete" placeholder="Adresse complète" value={form.adresse_complete} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Adresse</Label>
                <Input name="adresse" placeholder="Adresse" value={form.adresse} onChange={handleChange} />
              </div>
              <div>
                <Label className="text-sm font-medium">Ville</Label>
                <Input name="ville" placeholder="Ville" value={form.ville} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Code postal</Label>
                <Input name="code_postal" placeholder="Code postal" value={form.code_postal} onChange={handleChange} />
              </div>
              <div>
                <Label className="text-sm font-medium">Pays</Label>
                <Input name="pays" placeholder="Pays" value={form.pays} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending}
          >
            {isPending ? 
              <Loader2 className="animate-spin" size={16}/> : 'Enregistrer'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 