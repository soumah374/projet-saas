import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { DateInput } from '@/components/ui/DateInput';
import { 
  useCreateDevisAvecLignes,
  useActivitesParService,
  useIntervenantsParActivite,
  type LigneDevis,
  type LigneDevisIntervenant
} from '@/hooks/use-devis';
import { useClients } from '@/hooks/use-clients';
import { useServices } from '@/hooks/use-services';
import { useUnitesStandards } from '@/hooks/use-unites';
import { useFraisCategories } from '@/hooks/use-frais-categories';
import { useLignesFraisByCategory } from '@/hooks/use-lignes-frais';
import { toast } from 'sonner';
import { formatMontant } from '@/lib/formatters';
import type { LigneFrais } from '@/lib/types';

interface LigneForm {
  type_ligne: 'prestation' | 'frais' | ''; // Retour à la structure originale
  type_frais?: 'standard' | 'forfait' | 'offert'; // Sous-type pour les frais
  service_id?: string;
  activity_id?: string;
  frais_category_id?: string;
  ligne_frais_id?: string;
  quantite: string;
  unite_id: string;
  intervenants: IntervenantForm[];
  prix_unitaire?: string;
  montant?: string;
  description?: string;
  // Pour l'affichage
  service_name?: string;
  activity_intitule?: string;
  unite_intitule?: string;
  ligne_frais_description?: string;
}

interface IntervenantForm {
  profile_intervenant_id: string;
  temps_intervenant: string;
  taux_horaire: string;
  intitule: string;
}

export function DevisCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    client_id: '',
    date_validite: undefined as Date | undefined,
    taux_tva: 18.00,
    appliquer_tva: true,
    notes: '',
    conditions: '',
  });
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [currentLigne, setCurrentLigne] = useState<LigneForm>({
    type_ligne: '',
    service_id: '',
    activity_id: '',
    frais_category_id: '',
    ligne_frais_id: '',
    quantite: '1',
    unite_id: '',
    intervenants: [],
    prix_unitaire: '',
    type_frais: 'standard',
  });

  // Hooks
  const createDevisWithLignesMutation = useCreateDevisAvecLignes();
  
  const { data: clientsData } = useClients({ page_size: 1000 });
  const { data: servicesData } = useServices({ page_size: 1000 });
  const { data: unitesData } = useUnitesStandards({ page_size: 1000, is_active: true });
  const { data: activitesData, refetch: refetchActivites, isLoading: isLoadingActivites } = useActivitesParService(
    parseInt(currentLigne.service_id) || 0
  );
  const { data: intervenantsData, refetch: refetchIntervenants, isLoading: isLoadingIntervenants } = useIntervenantsParActivite(
    parseInt(currentLigne.activity_id) || 0
  );
  const { data: fraisCategories = [] } = useFraisCategories();
  const { data: lignesFraisRaw } = useLignesFraisByCategory(parseInt(currentLigne.frais_category_id || '0'));
  const lignesFrais: LigneFrais[] = Array.isArray(lignesFraisRaw)
    ? lignesFraisRaw
    : Array.isArray((lignesFraisRaw as any)?.results)
      ? (lignesFraisRaw as any).results
      : [];

  const clients = clientsData?.results || [];
  const services = servicesData?.results || [];
  const unites = unitesData?.results || [];
  const activites = activitesData || [];
  const intervenants = intervenantsData || [];

  useEffect(() => {
    if (currentLigne.service_id) {
      refetchActivites();
    }
  }, [currentLigne.service_id, refetchActivites]);

  useEffect(() => {
    if (currentLigne.activity_id) {
      refetchIntervenants();
    }
  }, [currentLigne.activity_id, refetchIntervenants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setForm({ ...form, date_validite: date });
  };

  const handleLigneChange = (field: keyof LigneForm, value: string) => {
    setCurrentLigne({ ...currentLigne, [field]: value });
  };

  // Réinitialiser l'activité et les intervenants quand le service change
  useEffect(() => {
    if (currentLigne.type_ligne === 'prestation' && currentLigne.service_id) {
      setCurrentLigne(prev => ({
        ...prev,
        activity_id: '',
        intervenants: []
      }));
      refetchActivites();
    }
  }, [currentLigne.type_ligne, currentLigne.service_id, refetchActivites]);

  // Réinitialiser les intervenants quand l'activité change
  useEffect(() => {
    if (currentLigne.type_ligne === 'prestation' && currentLigne.activity_id) {
      setCurrentLigne(prev => ({
        ...prev,
        intervenants: []
      }));
      refetchIntervenants();
    }
  }, [currentLigne.type_ligne, currentLigne.activity_id, refetchIntervenants]);

  const handleIntervenantChange = (index: number, field: keyof IntervenantForm, value: string) => {
    const newIntervenants = [...currentLigne.intervenants];
    newIntervenants[index] = { ...newIntervenants[index], [field]: value };
    
    // Si on change le profil intervenant, remplir automatiquement le temps, le taux et l'intitule
    if (field === 'profile_intervenant_id' && value) {
      const selectedIntervenant = intervenants.find(interv => interv.id.toString() === value);
      if (selectedIntervenant) {
        newIntervenants[index] = {
          ...newIntervenants[index],
          temps_intervenant: selectedIntervenant.temps_intervenant.toString(),
          taux_horaire: selectedIntervenant.taux_horaire.toString(),
          intitule: selectedIntervenant.intitule, // Ajouter l'intitule
        };
      }
    }
    
    setCurrentLigne({ ...currentLigne, intervenants: newIntervenants });
  };

  const addIntervenant = () => {
    setCurrentLigne({
      ...currentLigne,
      intervenants: [
        ...currentLigne.intervenants,
        { profile_intervenant_id: '', temps_intervenant: '', taux_horaire: '', intitule: ''}
      ]
    });
  };

  const removeIntervenant = (index: number) => {
    const newIntervenants = currentLigne.intervenants.filter((_, i) => i !== index);
    setCurrentLigne({ ...currentLigne, intervenants: newIntervenants });
  };



  // Calculer le montant pour un intervenant
  const calculateIntervenantMontant = (intervenant: IntervenantForm) => {
    const temps = parseFloat(intervenant.temps_intervenant) || 0;
    const taux = parseFloat(intervenant.taux_horaire) || 0;
    return formatMontant(temps * taux);
  };

  const addLigne = () => {
    if (currentLigne.type_ligne === 'prestation') {
      if (!currentLigne.service_id || !currentLigne.activity_id || !currentLigne.unite_id) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      if (currentLigne.intervenants.length === 0) {
        toast.error('Veuillez ajouter au moins un intervenant');
        return;
      }
    } else if (currentLigne.type_ligne === 'frais') {
      if (!currentLigne.frais_category_id || !currentLigne.ligne_frais_id || !currentLigne.unite_id || !currentLigne.prix_unitaire) {
        toast.error('Veuillez remplir tous les champs obligatoires pour la ligne de frais');
        return;
      }
    }

    // Calcul du prix unitaire et du montant
    let prixUnitaire = 0;
    let montant = 0;
    if (currentLigne.type_ligne === 'prestation') {
      prixUnitaire = currentLigne.intervenants.reduce((sum, interv) => {
        const temps = parseFloat(interv.temps_intervenant) || 0;
        const taux = parseFloat(interv.taux_horaire) || 0;
        return sum + (temps * taux);
      }, 0);
      montant = prixUnitaire * (parseFloat(currentLigne.quantite) || 1);
    } else if (currentLigne.type_ligne === 'frais') {
      prixUnitaire = parseFloat(currentLigne.prix_unitaire || '0');
      montant = prixUnitaire * (parseFloat(currentLigne.quantite) || 1);
    }

    // Récupérer les données complètes pour l'affichage
    const selectedService = services.find(s => s.id.toString() === currentLigne.service_id);
    const selectedActivity = activites.find(a => a.id.toString() === currentLigne.activity_id);
    const selectedUnite = unites.find(u => u.id.toString() === currentLigne.unite_id);
    const selectedLigneFrais = lignesFrais.find(lf => lf.id.toString() === currentLigne.ligne_frais_id);

    const ligneWithData = {
      ...currentLigne,
      service_name: selectedService?.name,
      activity_intitule: selectedActivity?.intitule,
      unite_intitule: selectedUnite?.intitule,
      ligne_frais_description: selectedLigneFrais?.description,
      prix_unitaire: prixUnitaire.toString(),
      montant: montant.toString(),
    };

    setLignes([...lignes, ligneWithData]);
    setCurrentLigne({
      type_ligne: '',
      service_id: '',
      activity_id: '',
      frais_category_id: '',
      ligne_frais_id: '',
      quantite: '1',
      unite_id: '',
      intervenants: [],
      prix_unitaire: '',
      type_frais: 'standard',
    });
  };

  const removeLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.client_id || !form.date_validite) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (lignes.length === 0) {
      toast.error('Veuillez ajouter au moins une ligne');
      return;
    }
    try {
      // Préparer les données des lignes avec leurs intervenants
      const lignesData = lignes.map(ligne => {
        if (ligne.type_ligne === 'prestation') {
          return {
            type_ligne: 'prestation' as const,
            service_id: parseInt(ligne.service_id!),
            activity_id: parseInt(ligne.activity_id!),
            description: ligne.description || '',
            quantite: parseFloat(ligne.quantite),
            unite_id: parseInt(ligne.unite_id),
            prix_unitaire_ht: parseFloat(ligne.prix_unitaire || '0'),
            intervenants: ligne.intervenants.map(intervenant => ({
              profile_intervenant_id: parseInt(intervenant.profile_intervenant_id),
              temps_intervenant: parseFloat(intervenant.temps_intervenant),
              taux_horaire: parseFloat(intervenant.taux_horaire),
              intitule: intervenant.intitule,
            }))
          };
        } else {
          return {
            type_ligne: 'frais' as const,
            frais_category_id: parseInt(ligne.frais_category_id!),
            ligne_frais_id: parseInt(ligne.ligne_frais_id!),
            description: '',
            quantite: parseFloat(ligne.quantite),
            unite_id: parseInt(ligne.unite_id),
            prix_unitaire_ht: parseFloat(ligne.prix_unitaire || '0'),
            type_frais: ligne.type_frais || 'standard',
          };
        }
      });
      // Créer le devis avec toutes ses lignes en une seule requête
      await createDevisWithLignesMutation.mutateAsync({
        client_id: parseInt(form.client_id),
        date_validite: form.date_validite.toISOString().split('T')[0],
        taux_tva: form.taux_tva,
        appliquer_tva: form.appliquer_tva,
        notes: form.notes,
        conditions: form.conditions,
        lignes: lignesData,
      });
      toast.success('Devis créé avec succès');
      navigate('/devis');
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      toast.error('Erreur lors de la création du devis');
    }
  };

  return (
    <div className="max-w-8xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/devis')}>
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Créer un devis</h1>
          </div>
        </div>
        <Button onClick={handleSave} disabled={createDevisWithLignesMutation.isPending}>
          {createDevisWithLignesMutation.isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Client *</Label>
              <Select value={form.client_id} onValueChange={(value) => handleSelectChange('client_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.nom_complet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Date de validité *</Label>
              <DateInput 
                value={form.date_validite}
                onChange={handleDateChange}
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Taux de TVA (%)</Label>
              <Input 
                type="number"
                name="taux_tva"
                value={form.taux_tva}
                onChange={(e) => setForm({ ...form, taux_tva: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
                placeholder="18.00"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Appliquer la TVA</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="appliquer_tva"
                  checked={form.appliquer_tva}
                  onChange={(e) => setForm({ ...form, appliquer_tva: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="appliquer_tva" className="text-sm">
                  Activer la TVA sur ce devis
                </Label>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea 
                name="notes" 
                placeholder="Notes du devis" 
                value={form.notes} 
                onChange={handleChange} 
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Conditions</Label>
              <Textarea 
                name="conditions" 
                placeholder="Conditions du devis" 
                value={form.conditions} 
                onChange={handleChange} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes de devis */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes de devis</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Lignes existantes */}
          {lignes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Lignes ajoutées</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead>Type de ligne</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {ligne.type_ligne === 'prestation'
                          ? ligne.activity_intitule || '—'
                          : ligne.ligne_frais_description || '—'
                        }
                        {ligne.type_ligne==='prestation' && (
                          <div className="text-sm text-muted-foreground">
                            {ligne.intervenants
                              .map(intervenant => {
                                return `${intervenant.intitule} (${intervenant.temps_intervenant}h @ ${ formatMontant(intervenant.taux_horaire)})`
                              })
                              .join(', ')
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{ligne.type_ligne === 'prestation' ? 'Prestation' : 'Frais'}</TableCell>
                      <TableCell>{ligne.quantite}</TableCell>
                      <TableCell>{formatMontant(parseFloat(ligne.prix_unitaire || '0'))}</TableCell>
                      <TableCell>{formatMontant(parseFloat(ligne.montant || '0'))}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => removeLigne(index)}>
                          <Trash2 size={16}/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Nouvelle ligne */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-medium">Nouvelle ligne</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <Label className="text-sm font-medium">Type de ligne *</Label>
                <Select value={currentLigne.type_ligne} onValueChange={(value) => handleLigneChange('type_ligne', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de ligne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prestation">Prestation</SelectItem>
                    <SelectItem value="frais">Frais</SelectItem>
                  </SelectContent>
                </Select>
                {!currentLigne.type_ligne && (
                  <p className="text-sm text-muted-foreground mt-1">
                    💡 Choisissez le type de ligne pour afficher les champs correspondants
                  </p>
                )}
              </div>
              {currentLigne.type_ligne === 'prestation' && (
                <>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Service *</Label>
                    <Select value={currentLigne.service_id} onValueChange={(value) => handleLigneChange('service_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Activité *</Label>
                    <Select value={currentLigne.activity_id} onValueChange={(value) => handleLigneChange('activity_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !currentLigne.service_id 
                            ? "Sélectionnez d'abord un service" 
                            : isLoadingActivites 
                              ? "Chargement des activités..." 
                              : "Sélectionner une activité"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {!currentLigne.service_id ? (
                          <SelectItem value="no-service" disabled>
                            Sélectionnez d'abord un service
                          </SelectItem>
                        ) : isLoadingActivites ? (
                          <SelectItem value="loading" disabled>
                            Chargement...
                          </SelectItem>
                        ) : activites.length === 0 ? (
                          <SelectItem value="no-activities" disabled>
                            Aucune activité trouvée pour ce service
                          </SelectItem>
                        ) : (
                          activites.map(activite => (
                            <SelectItem key={activite.id} value={activite.id.toString()}>
                              {activite.intitule}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Unité *</Label>
                    <Select value={currentLigne.unite_id} onValueChange={(value) => handleLigneChange('unite_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {unites.map(unite => (
                          <SelectItem key={unite.id} value={unite.id.toString()}>
                            {unite.intitule} ({unite.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Quantité</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.quantite} 
                      onChange={(e) => handleLigneChange('quantite', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </>
              )}
              {currentLigne.type_ligne === 'frais' && (
                <>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Type de frais *</Label>
                    <Select value={currentLigne.type_frais || ''} onValueChange={(value) => handleLigneChange('type_frais', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="offert">Offert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Catégorie de frais *</Label>
                    <Select value={currentLigne.frais_category_id} onValueChange={(value) => handleLigneChange('frais_category_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        {fraisCategories.length === 0 ? (
                          <SelectItem value="no-category" disabled>Aucune catégorie trouvée</SelectItem>
                        ) : (
                          fraisCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Ligne de frais *</Label>
                    <Select value={currentLigne.ligne_frais_id} onValueChange={(value) => handleLigneChange('ligne_frais_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ligne de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        {lignesFrais.length === 0 ? (
                          <SelectItem value="no-ligne" disabled>Aucune ligne de frais</SelectItem>
                        ) : (
                          lignesFrais.map(lf => (
                            <SelectItem key={lf.id} value={lf.id.toString()}>{lf.description}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Prix unitaire *</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.prix_unitaire}
                      onChange={(e) => handleLigneChange('prix_unitaire', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Quantité</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.quantite} 
                      onChange={(e) => handleLigneChange('quantite', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Unité</Label>
                    <Select value={currentLigne.unite_id} onValueChange={(value) => handleLigneChange('unite_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {unites.map(unite => (
                          <SelectItem key={unite.id} value={unite.id.toString()}>
                            {unite.intitule} ({unite.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            {/* Intervenants : uniquement pour prestation */}
            {currentLigne.type_ligne === 'prestation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Intervenants</Label>
                  <Button size="sm" onClick={addIntervenant}>
                    <Plus size={16} className="mr-2" />
                    Ajouter intervenant
                  </Button>
                </div>
                {currentLigne.intervenants.map((intervenant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label className="text-sm font-medium">Profil *</Label>
                      <Select 
                        value={intervenant.profile_intervenant_id} 
                        onValueChange={(value) => handleIntervenantChange(index, 'profile_intervenant_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !currentLigne.activity_id 
                              ? "Sélectionnez d'abord une activité" 
                              : isLoadingIntervenants 
                                ? "Chargement des intervenants..." 
                                : "Sélectionner un profil"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {!currentLigne.activity_id ? (
                            <SelectItem value="no-activity" disabled>
                              Sélectionnez d'abord une activité
                            </SelectItem>
                          ) : isLoadingIntervenants ? (
                            <SelectItem value="loading-intervenants" disabled>
                              Chargement...
                            </SelectItem>
                          ) : intervenants.length === 0 ? (
                            <SelectItem value="no-intervenants" disabled>
                              Aucun intervenant trouvé pour cette activité
                            </SelectItem>
                          ) : (
                            intervenants.map(interv => (
                              <SelectItem key={interv.id} value={interv.id.toString()}>
                                {interv.intitule} ({interv.temps_intervenant}h - {formatMontant(interv.taux_horaire)}/h)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Temps (h) *</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={intervenant.temps_intervenant} 
                        onChange={(e) => handleIntervenantChange(index, 'temps_intervenant', e.target.value)}
                        placeholder="0"
                        className={intervenant.profile_intervenant_id && intervenant.temps_intervenant ? "border-green-200 bg-green-50" : ""}
                        title={intervenant.profile_intervenant_id && intervenant.temps_intervenant ? "Valeur pré-remplie automatiquement" : ""}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Taux horaire (€) *</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={intervenant.taux_horaire} 
                        onChange={(e) => handleIntervenantChange(index, 'taux_horaire', e.target.value)}
                        placeholder="0"
                        className={intervenant.profile_intervenant_id && intervenant.taux_horaire ? "border-green-200 bg-green-50" : ""}
                        title={intervenant.profile_intervenant_id && intervenant.taux_horaire ? "Valeur pré-remplie automatiquement" : ""}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Montant</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={calculateIntervenantMontant(intervenant)}
                          readOnly
                          className="bg-gray-50 text-gray-700"
                          placeholder="0,00 €"
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeIntervenant(index)}>
                          <Trash2 size={16}/>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={addLigne} className="w-full">
              <Plus size={16} className="mr-2" />
              Ajouter cette ligne
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 