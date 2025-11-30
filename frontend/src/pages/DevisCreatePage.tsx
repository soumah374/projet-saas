import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { DateInput } from '@/components/ui/DateInput';
import { ClientAutocomplete } from '@/components/ui/ClientAutocomplete';
import { ServiceAutocomplete } from '@/components/ui/ServiceAutocomplete';
import { ActivityAutocomplete } from '@/components/ui/ActivityAutocomplete';
import { UniteAutocomplete } from '@/components/ui/UniteAutocomplete';
import { FraisCategoryAutocomplete } from '@/components/ui/FraisCategoryAutocomplete';
import { LigneFraisAutocomplete } from '@/components/ui/LigneFraisAutocomplete';
import {
  useCreateDevisAvecLignes,
  useActivitesParService,
  useIntervenantsParActivite,
} from '@/hooks/use-devis';
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
    taux_frais_agence: 15.00,
    appliquer_frais_agence: true,
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

  const [errors, setErrors] = useState<{
    client_id?: string;
    date_validite?: string;
    lignes?: string;
  }>({});

  const [ligneErrors, setLigneErrors] = useState<{
    type_ligne?: string;
    service_id?: string;
    activity_id?: string;
    frais_category_id?: string;
    ligne_frais_id?: string;
    unite_id?: string;
    prix_unitaire?: string;
    intervenants?: string;
    type_frais?: string;
  }>({});

  // Hooks
  const createDevisWithLignesMutation = useCreateDevisAvecLignes();
  
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

  // Fonction utilitaire pour calculer la quantité et le prix unitaire selon les règles métier
  const calculateQuantiteAndPrixUnitaire = (intervenants: IntervenantForm[], uniteId: string) => {
    if (intervenants.length <= 1) {
      // Logique normale pour un seul intervenant
      const prixUnitaire = intervenants.reduce((sum, interv) => {
        const temps = parseFloat(interv.temps_intervenant) || 0;
        const taux = parseFloat(interv.taux_horaire) || 0;
        return sum + (temps * taux);
      }, 0);
      return { quantite: 1, prixUnitaire };
    }

    const selectedUnite = unites.find(u => u.id.toString() === uniteId);
    const uniteIntitule = selectedUnite?.intitule?.toLowerCase() || '';
    const isUniteJour = ['heure', 'homme-jour', 'jour'].some(unite => 
      uniteIntitule.includes(unite.toLowerCase())
    );

    if (isUniteJour) {
      // Calculer la quantité basée sur la somme des temps intervenant divisée par 8
      const totalTempsIntervenant = intervenants.reduce((sum, interv) => {
        return sum + (parseFloat(interv.temps_intervenant) || 0);
      }, 0);
      
      const quantite = totalTempsIntervenant / 8;
      
      // Calculer la somme des montants par intervenant
      const sommeMontantsIntervenants = intervenants.reduce((sum, interv) => {
        const temps = parseFloat(interv.temps_intervenant) || 0;
        const taux = parseFloat(interv.taux_horaire) || 0;
        return sum + (temps * taux);
      }, 0);
      
      // Le prix unitaire est égal à la somme des montants divisée par la quantité
      const prixUnitaire = quantite > 0 ? sommeMontantsIntervenants / quantite : 0;
      return { quantite, prixUnitaire };
    } else {
      // Logique normale pour les autres unités
      const prixUnitaire = intervenants.reduce((sum, interv) => {
        const temps = parseFloat(interv.temps_intervenant) || 0;
        const taux = parseFloat(interv.taux_horaire) || 0;
        return sum + (temps * taux);
      }, 0);
      return { quantite: 1, prixUnitaire };
    }
  };

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
    const newLigne = { ...currentLigne, [field]: value };

    // Si on change le service, réinitialiser l'activité
    if (field === 'service_id') {
      newLigne.activity_id = '';
    }

    // Si on change la catégorie de frais, réinitialiser la ligne de frais
    if (field === 'frais_category_id') {
      newLigne.ligne_frais_id = '';
    }

    // Si on change l'unité, recalculer automatiquement la quantité et le prix unitaire
    if (field === 'unite_id' && newLigne.type_ligne === 'prestation' && newLigne.intervenants.length > 1) {
      const { quantite, prixUnitaire } = calculateQuantiteAndPrixUnitaire(newLigne.intervenants, value);
      newLigne.quantite = quantite.toString();
      newLigne.prix_unitaire = prixUnitaire.toString();
    }

    setCurrentLigne(newLigne);
  };

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
    
    const newLigne = { ...currentLigne, intervenants: newIntervenants };
    
    // Recalculer automatiquement la quantité et le prix unitaire si nécessaire
    if (newLigne.type_ligne === 'prestation' && newLigne.intervenants.length > 1) {
      const { quantite, prixUnitaire } = calculateQuantiteAndPrixUnitaire(newIntervenants, newLigne.unite_id);
      newLigne.quantite = quantite.toString();
      newLigne.prix_unitaire = prixUnitaire.toString();
    }
    
    setCurrentLigne(newLigne);
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
    clearErrors();
    
    if (!validateCurrentLigne()) {
      toast.error('Veuillez corriger les erreurs avant d\'ajouter la ligne');
      return;
    }

    // Récupérer les données complètes pour l'affichage
    const selectedService = services.find(s => s.id.toString() === currentLigne.service_id);
    const selectedActivity = activites.find(a => a.id.toString() === currentLigne.activity_id);
    const selectedUnite = unites.find(u => u.id.toString() === currentLigne.unite_id);
    const selectedLigneFrais = lignesFrais.find(lf => lf.id.toString() === currentLigne.ligne_frais_id);

    // Calcul du prix unitaire et du montant
    let prixUnitaire = 0;
    let montant = 0;
    let quantiteCalculee = parseFloat(currentLigne.quantite) || 1;

    if (currentLigne.type_ligne === 'prestation') {
      // Utiliser le prix unitaire saisi manuellement
      prixUnitaire = parseFloat(currentLigne.prix_unitaire || '0');
      montant = prixUnitaire * quantiteCalculee;
    } else if (currentLigne.type_ligne === 'frais') {
      prixUnitaire = parseFloat(currentLigne.prix_unitaire || '0');
      montant = prixUnitaire * quantiteCalculee;
    }

    const ligneWithData = {
      ...currentLigne,
      quantite: quantiteCalculee.toString(),
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

  // Fonctions de validation
  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!form.client_id) {
      newErrors.client_id = 'Le client est obligatoire';
    }
    
    if (!form.date_validite) {
      newErrors.date_validite = 'La date de validité est obligatoire';
    }
    
    if (lignes.length === 0) {
      newErrors.lignes = 'Au moins une ligne est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentLigne = () => {
    const newLigneErrors: typeof ligneErrors = {};
    
    if (!currentLigne.type_ligne) {
      newLigneErrors.type_ligne = 'Le type de ligne est obligatoire';
    }
    
    if (currentLigne.type_ligne === 'prestation') {
      if (!currentLigne.service_id) {
        newLigneErrors.service_id = 'Le service est obligatoire';
      }
      if (!currentLigne.activity_id) {
        newLigneErrors.activity_id = "L'activité est obligatoire";
      }
      if (!currentLigne.unite_id) {
        newLigneErrors.unite_id = "L'unité est obligatoire";
      }
      // if (currentLigne.intervenants.length === 0) {
      //   newLigneErrors.intervenants = 'Au moins un intervenant est obligatoire';
      // }
    }
    
    if (currentLigne.type_ligne === 'frais') {
      if (!currentLigne.type_frais) {
        newLigneErrors.type_frais = 'Le type de frais est obligatoire';
      }
      if (!currentLigne.frais_category_id) {
        newLigneErrors.frais_category_id = 'La catégorie de frais est obligatoire';
      }
      if (!currentLigne.ligne_frais_id) {
        newLigneErrors.ligne_frais_id = 'La ligne de frais est obligatoire';
      }
      if (!currentLigne.unite_id) {
        newLigneErrors.unite_id = "L'unité est obligatoire";
      }
      if (!currentLigne.prix_unitaire) {
        newLigneErrors.prix_unitaire = 'Le prix unitaire est obligatoire';
      }
    }
    
    setLigneErrors(newLigneErrors);
    return Object.keys(newLigneErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
    setLigneErrors({});
  };

  const handleSave = async () => {
    clearErrors();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs avant de continuer');
      return;
    }
    
    try {
      // Préparer les données des lignes avec leurs intervenants

      console.log(lignes)
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
            montant_ht: parseFloat(ligne.montant || '0'),
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
        taux_tva: form.appliquer_tva ? form.taux_tva : 0,
        appliquer_tva: form.appliquer_tva,
        taux_frais_agence: form.appliquer_frais_agence ? form.taux_frais_agence : 0,
        appliquer_frais_agence: form.appliquer_frais_agence,
        notes: form.notes,
        conditions: form.conditions,
        lignes: lignesData as any,
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
              <Label className={`text-sm font-medium ${errors.client_id ? 'text-red-600' : ''}`}>
                Client *
              </Label>
              <ClientAutocomplete
                value={form.client_id}
                onValueChange={(value) => setForm({ ...form, client_id: value })}
                placeholder="Rechercher un client..."
                className={errors.client_id ? 'border-red-500 focus:border-red-500 w-full' : form.client_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
              />
              {errors.client_id && (
                <p className="text-sm text-red-600 mt-1">{errors.client_id}</p>
              )}
            </div>
            <div>
              <Label className={`text-sm font-medium ${errors.date_validite ? 'text-red-600' : ''}`}>
                Date de validité *
              </Label>
              <DateInput 
                value={form.date_validite}
                onChange={handleDateChange}
                required
                className={errors.date_validite ? 'border-red-500 focus:border-red-500' : form.date_validite ? 'border-green-500 bg-green-50' : ''}
              />
              {errors.date_validite && (
                <p className="text-sm text-red-600 mt-1">{errors.date_validite}</p>
              )}
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
            {form.appliquer_tva && (
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
            )}
            <div>
              <Label className="text-sm font-medium">Appliquer les frais d'agence</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="appliquer_frais_agence"
                  checked={form.appliquer_frais_agence}
                  onChange={(e) => setForm({ ...form, appliquer_frais_agence: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="appliquer_frais_agence" className="text-sm">
                  Activer les frais d'agence (Conseil, Accompagnement & Coordination générale)
                </Label>
              </div>
            </div>
            {form.appliquer_frais_agence && (
              <div>
                <Label className="text-sm font-medium">Taux des frais d'agence (%)</Label>
                <Input 
                  type="number"
                  name="taux_frais_agence"
                  value={form.taux_frais_agence}
                  onChange={(e) => setForm({ ...form, taux_frais_agence: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="15.00"
                />
              </div>
            )}
            
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
          {/* Affichage de l'erreur pour les lignes */}
          {errors.lignes && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.lignes}</p>
            </div>
          )}

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
                    <TableHead>Unité</TableHead>
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
                      </TableCell>
                      <TableCell>{ligne.type_ligne === 'prestation' ? 'Prestation' : 'Frais'}</TableCell>
                      <TableCell>{ligne.quantite}</TableCell>
                      <TableCell>{ligne.unite_intitule || '—'}</TableCell>
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
                <Label className={`text-sm font-medium ${ligneErrors.type_ligne ? 'text-red-600' : ''}`}>
                  Type de ligne *
                </Label>
                <Select value={currentLigne.type_ligne} onValueChange={(value) => handleLigneChange('type_ligne', value)}>
                  <SelectTrigger className={ligneErrors.type_ligne ? 'border-red-500 focus:border-red-500' : currentLigne.type_ligne ? 'border-green-500 bg-green-50' : ''}>
                    <SelectValue placeholder="Sélectionner un type de ligne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prestation">Prestation</SelectItem>
                    <SelectItem value="frais">Frais</SelectItem>
                  </SelectContent>
                </Select>
                {ligneErrors.type_ligne && (
                  <p className="text-sm text-red-600 mt-1">{ligneErrors.type_ligne}</p>
                )}
                {!currentLigne.type_ligne && !ligneErrors.type_ligne && (
                  <p className="text-sm text-muted-foreground mt-1">
                    💡 Choisissez le type de ligne pour afficher les champs correspondants
                  </p>
                )}
              </div>
              {currentLigne.type_ligne === 'prestation' && (
                <>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.service_id ? 'text-red-600' : ''}`}>
                      Service *
                    </Label>
                    <ServiceAutocomplete
                      value={currentLigne.service_id}
                      onValueChange={(value) => handleLigneChange('service_id', value)}
                      services={services}
                      placeholder="Rechercher un service..."
                      className={ligneErrors.service_id ? 'border-red-500 focus:border-red-500 w-full' : currentLigne.service_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
                    />
                    {ligneErrors.service_id && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.service_id}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.activity_id ? 'text-red-600' : ''}`}>
                      Activité *
                    </Label>
                    <ActivityAutocomplete
                      value={currentLigne.activity_id}
                      onValueChange={(value) => handleLigneChange('activity_id', value)}
                      activities={activites}
                      isLoading={isLoadingActivites}
                      serviceSelected={!!currentLigne.service_id}
                      placeholder="Rechercher une activité..."
                      className={ligneErrors.activity_id ? 'border-red-500 focus:border-red-500 w-full' : currentLigne.activity_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
                    />
                    {ligneErrors.activity_id && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.activity_id}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.unite_id ? 'text-red-600' : ''}`}>
                      Unité *
                    </Label>
                    <UniteAutocomplete
                      value={currentLigne.unite_id}
                      onValueChange={(value) => handleLigneChange('unite_id', value)}
                      unites={unites}
                      placeholder="Rechercher une unité..."
                      className={ligneErrors.unite_id ? 'border-red-500 focus:border-red-500 w-full' : currentLigne.unite_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
                    />
                    {ligneErrors.unite_id && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.unite_id}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Quantité *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentLigne.quantite}
                      onChange={(e) => handleLigneChange('quantite', e.target.value)}
                      placeholder="1"
                      className={currentLigne.quantite && parseFloat(currentLigne.quantite) > 0 ? 'border-green-500 bg-green-50' : ''}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.prix_unitaire ? 'text-red-600' : ''}`}>
                      Prix unitaire HT (GNF) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentLigne.prix_unitaire || ''}
                      onChange={(e) => handleLigneChange('prix_unitaire', e.target.value)}
                      placeholder="0"
                      className={ligneErrors.prix_unitaire ? 'border-red-500 focus:border-red-500' : currentLigne.prix_unitaire ? 'border-green-500 bg-green-50' : ''}
                    />
                    {ligneErrors.prix_unitaire && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.prix_unitaire}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Montant HT (GNF)</Label>
                    <Input
                      type="text"
                      value={formatMontant((parseFloat(currentLigne.quantite) || 0) * (parseFloat(currentLigne.prix_unitaire || '0')))}
                      readOnly
                      className="bg-gray-50 text-gray-700 font-medium"
                      placeholder="0,00 GNF"
                    />
                  </div>
                </>
              )}
              {currentLigne.type_ligne === 'frais' && (
                <>
                  <div className="md:col-span-1/2">
                    <Label className={`text-sm font-medium ${ligneErrors.type_frais ? 'text-red-600' : ''}`}>
                      Type de frais *
                    </Label>
                    <Select value={currentLigne.type_frais || ''} onValueChange={(value) => handleLigneChange('type_frais', value)}>
                      <SelectTrigger className={ligneErrors.type_frais ? 'border-red-500 focus:border-red-500' : currentLigne.type_frais ? 'border-green-500 bg-green-50' : ''}>
                        <SelectValue placeholder="Sélectionner un type de frais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="forfait">Forfait</SelectItem>
                        <SelectItem value="offert">Offert</SelectItem>
                      </SelectContent>
                    </Select>
                    {ligneErrors.type_frais && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.type_frais}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.frais_category_id ? 'text-red-600' : ''}`}>
                      Catégorie de frais *
                    </Label>
                    <FraisCategoryAutocomplete
                      value={currentLigne.frais_category_id}
                      onValueChange={(value) => handleLigneChange('frais_category_id', value)}
                      categories={fraisCategories}
                      placeholder="Rechercher une catégorie..."
                      className={ligneErrors.frais_category_id ? 'border-red-500 focus:border-red-500 w-full' : currentLigne.frais_category_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
                    />
                    {ligneErrors.frais_category_id && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.frais_category_id}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.ligne_frais_id ? 'text-red-600' : ''}`}>
                      Ligne de frais *
                    </Label>
                    <LigneFraisAutocomplete
                      value={currentLigne.ligne_frais_id}
                      onValueChange={(value) => handleLigneChange('ligne_frais_id', value)}
                      lignesFrais={lignesFrais}
                      categorySelected={!!currentLigne.frais_category_id}
                      placeholder="Rechercher une ligne de frais..."
                      className={ligneErrors.ligne_frais_id ? 'border-red-500 focus:border-red-500 w-full' : currentLigne.ligne_frais_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
                    />
                    {ligneErrors.ligne_frais_id && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.ligne_frais_id}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.prix_unitaire ? 'text-red-600' : ''}`}>
                      Prix unitaire *
                    </Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={currentLigne.prix_unitaire}
                      onChange={(e) => handleLigneChange('prix_unitaire', e.target.value)}
                      placeholder="0"
                      className={ligneErrors.prix_unitaire ? 'border-red-500 focus:border-red-500' : currentLigne.prix_unitaire ? 'border-green-500 bg-green-50' : ''}
                    />
                    {ligneErrors.prix_unitaire && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.prix_unitaire}</p>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Quantité</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentLigne.quantite}
                      onChange={(e) => handleLigneChange('quantite', e.target.value)}
                      placeholder="1"
                      className={currentLigne.quantite && parseFloat(currentLigne.quantite) > 0 ? 'border-green-500 bg-green-50' : ''}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium">Montant HT (GNF)</Label>
                    <Input
                      type="text"
                      value={formatMontant((parseFloat(currentLigne.quantite) || 0) * (parseFloat(currentLigne.prix_unitaire || '0')))}
                      readOnly
                      className="bg-gray-50 text-gray-700 font-medium"
                      placeholder="0,00 GNF"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label className={`text-sm font-medium ${ligneErrors.unite_id ? 'text-red-600' : ''}`}>
                      Unité *
                    </Label>
                    <UniteAutocomplete
                      value={currentLigne.unite_id}
                      onValueChange={(value) => handleLigneChange('unite_id', value)}
                      unites={unites}
                      placeholder="Rechercher une unité..."
                      className={ligneErrors.unite_id ? 'border-red-500 focus:border-red-500 w-full' : currentLigne.unite_id ? 'border-green-500 bg-green-50 w-full' : 'w-full'}
                    />
                    {ligneErrors.unite_id && (
                      <p className="text-sm text-red-600 mt-1">{ligneErrors.unite_id}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Intervenants : uniquement pour prestation */}
            {/* {currentLigne.type_ligne === 'prestation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className={`text-sm font-medium ${ligneErrors.intervenants ? 'text-red-600' : ''}`}>
                    Intervenants *
                  </Label>
                  <Button size="sm" onClick={addIntervenant}>
                    <Plus size={16} className="mr-2" />
                    Ajouter intervenant
                  </Button>
                </div>
                {ligneErrors.intervenants && (
                  <p className="text-sm text-red-600">{ligneErrors.intervenants}</p>
                )}
                {currentLigne.intervenants.map((intervenant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label className="text-sm font-medium">Profil *</Label>
                      <Select 
                        value={intervenant.profile_intervenant_id} 
                        onValueChange={(value) => handleIntervenantChange(index, 'profile_intervenant_id', value)}
                      >
                        <SelectTrigger className={intervenant.profile_intervenant_id ? 'border-green-500 bg-green-50' : ''}>
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
                        className={intervenant.temps_intervenant && parseFloat(intervenant.temps_intervenant) > 0 ? 'border-green-500 bg-green-50' : ''}
                        title={intervenant.profile_intervenant_id && intervenant.temps_intervenant ? "Valeur pré-remplie automatiquement" : ""}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Taux horaire (GNF) *</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={intervenant.taux_horaire} 
                        onChange={(e) => handleIntervenantChange(index, 'taux_horaire', e.target.value)}
                        placeholder="0"
                        className={intervenant.taux_horaire && parseFloat(intervenant.taux_horaire) > 0 ? 'border-green-500 bg-green-50' : ''}
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
                          placeholder="0,00 GNF"
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeIntervenant(index)}>
                          <Trash2 size={16}/>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )} */}
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