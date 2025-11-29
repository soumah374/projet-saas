# Flux Devis → Contrat → Projet - Analyse et Améliorations

## 📊 Architecture Actuelle

### Flux de Données
```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌────────────┐
│  DEVIS  │─────>│ CONTRAT  │─────>│ PROJET  │─────>│   TÂCHES   │
└─────────┘      └──────────┘      └─────────┘      └────────────┘
     │                                                      │
     └──────────────────────────────────────────────────────┘
                    (via ligne_devis)
```

### Relations Actuelles

1. **Devis** → **Contrat**
   - Type: `ManyToManyField`
   - Un contrat peut être basé sur plusieurs devis
   - Un devis peut générer plusieurs contrats

2. **Contrat** → **Projet**
   - Type: `ForeignKey` dans Project
   - Un projet est lié à un contrat
   - Un contrat peut avoir plusieurs projets

3. **LigneDevis** → **ProjectTask**
   - Type: `ForeignKey` dans ProjectTask
   - Une tâche peut être liée à une ligne de devis
   - Permet de tracer l'origine des tâches

---

## 🎯 Améliorations Proposées

### 1. **Création Automatique de Projet depuis Contrat**

#### Problématique
Actuellement, il n'y a pas de mécanisme automatique pour créer un projet quand un contrat est signé.

#### Solution Proposée

```python
# backend/contrats/models.py - Méthode à ajouter

class Contrat(models.Model):
    # ... (code existant)

    def creer_projet_depuis_contrat(self, titre=None, description=None):
        """
        Crée automatiquement un projet à partir du contrat
        avec génération des tâches depuis les lignes de devis
        """
        from projects.models import Project, ProjectTask, ProjectMember
        from django.contrib.auth import get_user_model

        User = get_user_model()

        # Créer le projet
        projet = Project.objects.create(
            title=titre or f"Projet - {self.numero}",
            description=description or f"Projet généré depuis le contrat {self.numero}",
            type='Externe',
            status='Prospection',
            priority='Normale',
            client=self.client,
            contract=self,
            budget=self.montant_ttc,
            start_date=self.date_debut,
            deadline=self.date_fin,
            created_by=User.objects.first()  # À adapter selon votre logique
        )

        # Récupérer toutes les lignes de devis des devis associés
        lignes_devis = []
        for devis in self.devis.all():
            lignes_devis.extend(devis.lignes.filter(type_ligne='prestation'))

        # Créer les tâches depuis les lignes de devis
        for ligne in lignes_devis:
            if ligne.activity:
                # Calculer les dates estimées
                duree_jours = int(ligne.quantite) if ligne.unite.code in ['jour', 'jours'] else 1

                task = ProjectTask.objects.create(
                    project=projet,
                    title=ligne.activity.name,
                    description=ligne.description or ligne.activity.name,
                    status='À faire',
                    priority='Normale',
                    estimated_hours=float(ligne.quantite) if ligne.unite.code in ['heure', 'heures'] else 0,
                    start_date=self.date_debut,
                    due_date=self.date_debut + timezone.timedelta(days=duree_jours),
                    ligne_devis=ligne
                )

                # Assigner les intervenants si présents
                for intervenant in ligne.intervenants.all():
                    if intervenant.profile_intervenant.user:
                        # Créer le membre de projet
                        ProjectMember.objects.get_or_create(
                            project=projet,
                            user=intervenant.profile_intervenant.user,
                            defaults={
                                'role': 'Membre',
                                'allocation_percentage': 50
                            }
                        )

                        # Assigner la tâche
                        task.assigned_to = intervenant.profile_intervenant.user
                        task.save()

        return projet

    def synchroniser_projet_avec_contrat(self):
        """
        Synchronise le projet existant avec les modifications du contrat
        """
        if not hasattr(self, 'projects') or not self.projects.exists():
            return None

        projet = self.projects.first()

        # Mettre à jour les informations du projet
        projet.budget = self.montant_ttc
        projet.deadline = self.date_fin
        projet.start_date = self.date_debut
        projet.save()

        return projet
```

#### Endpoint API

```python
# backend/contrats/views.py

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class ContratViewSet(viewsets.ModelViewSet):
    # ... (code existant)

    @action(detail=True, methods=['post'])
    def creer_projet(self, request, pk=None):
        """
        Créer un projet depuis ce contrat
        POST /api/contrats/{id}/creer_projet/

        Body (optionnel):
        {
            "titre": "Nom du projet",
            "description": "Description du projet"
        }
        """
        contrat = self.get_object()

        # Vérifier que le contrat est signé
        if contrat.statut not in ['signe', 'actif']:
            return Response(
                {'error': 'Le contrat doit être signé pour créer un projet'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier qu'un projet n'existe pas déjà
        if contrat.projects.exists():
            return Response(
                {'error': 'Un projet existe déjà pour ce contrat'},
                status=status.HTTP_400_BAD_REQUEST
            )

        titre = request.data.get('titre')
        description = request.data.get('description')

        try:
            projet = contrat.creer_projet_depuis_contrat(titre, description)

            from projects.serializers import ProjectSerializer
            serializer = ProjectSerializer(projet)

            return Response({
                'message': 'Projet créé avec succès',
                'project': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la création du projet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

---

### 2. **Tableau de Bord Devis → Projet**

#### Interface Frontend

```typescript
// frontend/src/components/contrats/ContratToProjectButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { RocketIcon } from 'lucide-react';
import { api } from '@/lib/api';

interface ContratToProjectButtonProps {
  contratId: string;
  contratNumero: string;
  onProjectCreated?: (projectId: string) => void;
}

export const ContratToProjectButton = ({
  contratId,
  contratNumero,
  onProjectCreated
}: ContratToProjectButtonProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titre, setTitre] = useState(`Projet - ${contratNumero}`);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/contrats/${contratId}/creer_projet/`, {
        titre,
        description
      });

      toast({
        title: 'Projet créé',
        description: 'Le projet a été créé avec succès à partir du contrat.'
      });

      setOpen(false);

      if (onProjectCreated && response.data.project) {
        onProjectCreated(response.data.project.id);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error || 'Impossible de créer le projet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="default">
        <RocketIcon className="h-4 w-4 mr-2" />
        Créer un Projet
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un Projet depuis le Contrat</DialogTitle>
            <DialogDescription>
              Un nouveau projet sera créé avec les tâches générées automatiquement depuis les lignes de devis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titre">Titre du Projet</Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Nom du projet"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du projet..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateProject} disabled={loading}>
                {loading ? 'Création...' : 'Créer le Projet'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

---

### 3. **Vue Traçabilité: Devis → Contrat → Projet → Tâches**

#### Composant de Traçabilité

```typescript
// frontend/src/components/projects/ProjectTraceability.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileCheck, Briefcase, CheckSquare } from 'lucide-react';

interface TraceabilityProps {
  project: any;
}

export const ProjectTraceability = ({ project }: TraceabilityProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Traçabilité</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Devis */}
          {project.contract?.devis && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <div className="font-medium">Devis d'Origine</div>
                <div className="text-sm text-gray-600">
                  {project.contract.devis.map((devis: any) => (
                    <Badge key={devis.numero} variant="outline" className="mr-2">
                      {devis.numero}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contrat */}
          {project.contract && (
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <div className="font-medium">Contrat</div>
                <div className="text-sm text-gray-600">
                  <Badge variant="outline">{project.contract.numero}</Badge>
                  <span className="ml-2 text-xs">
                    Signé le {new Date(project.contract.date_creation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Projet */}
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-purple-500 mt-1" />
            <div>
              <div className="font-medium">Projet</div>
              <div className="text-sm text-gray-600">
                <Badge variant="outline">{project.id}</Badge>
                <span className="ml-2 text-xs">
                  Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques Tâches */}
          <div className="flex items-start gap-3">
            <CheckSquare className="h-5 w-5 text-orange-500 mt-1" />
            <div>
              <div className="font-medium">Tâches</div>
              <div className="text-sm text-gray-600">
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">
                    {project.tasks_count || 0} tâches générées
                  </Badge>
                  <Badge variant="secondary">
                    {project.tasks_from_devis || 0} depuis devis
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

### 4. **Synchronisation Bidirectionnelle**

#### Détection de Changements dans le Contrat

```python
# backend/contrats/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Contrat

@receiver(post_save, sender=Contrat)
def sync_project_on_contract_update(sender, instance, created, **kwargs):
    """
    Synchroniser le projet lorsque le contrat est modifié
    """
    if not created and instance.projects.exists():
        # Le contrat a été modifié, synchroniser le projet
        instance.synchroniser_projet_avec_contrat()
```

#### Mise à Jour des Tâches depuis Ligne Devis

```python
# backend/projects/models.py

class ProjectTask(models.Model):
    # ... (code existant)

    def synchroniser_avec_ligne_devis(self):
        """
        Synchronise les informations de la tâche avec la ligne de devis
        """
        if not self.ligne_devis:
            return

        ligne = self.ligne_devis

        # Mettre à jour le titre si basé sur l'activité
        if ligne.activity:
            self.title = ligne.activity.name

        # Mettre à jour la description
        if ligne.description:
            self.description = ligne.description

        # Mettre à jour les heures estimées
        if ligne.unite and ligne.unite.code in ['heure', 'heures']:
            self.estimated_hours = float(ligne.quantite)

        self.save()
```

---

### 5. **Rapports et Analytics**

#### Analyse Devis → Projet

```python
# backend/projects/services.py

from django.db.models import Count, Sum, Avg, Q
from decimal import Decimal

class ProjectAnalyticsService:

    @staticmethod
    def get_conversion_metrics():
        """
        Obtenir les métriques de conversion Devis → Contrat → Projet
        """
        from devis.models import Devis
        from contrats.models import Contrat
        from projects.models import Project

        # Nombre total de devis
        total_devis = Devis.objects.count()

        # Devis acceptés (ayant un contrat)
        devis_acceptes = Devis.objects.filter(
            Q(contrats__isnull=False) | Q(contrat_principal__isnull=False)
        ).distinct().count()

        # Contrats avec projets
        contrats_avec_projet = Contrat.objects.filter(
            projects__isnull=False
        ).distinct().count()

        # Projets actifs
        projets_actifs = Project.objects.exclude(
            status='Terminé'
        ).count()

        # Taux de conversion
        taux_devis_contrat = (devis_acceptes / total_devis * 100) if total_devis > 0 else 0
        total_contrats = Contrat.objects.count()
        taux_contrat_projet = (contrats_avec_projet / total_contrats * 100) if total_contrats > 0 else 0

        # Valeur moyenne
        valeur_moyenne_devis = Devis.objects.aggregate(
            avg=Avg('montant_ttc')
        )['avg'] or Decimal('0')

        valeur_moyenne_projet = Project.objects.aggregate(
            avg=Avg('budget')
        )['avg'] or Decimal('0')

        return {
            'total_devis': total_devis,
            'devis_acceptes': devis_acceptes,
            'contrats_avec_projet': contrats_avec_projet,
            'projets_actifs': projets_actifs,
            'taux_conversion_devis_contrat': round(taux_devis_contrat, 2),
            'taux_conversion_contrat_projet': round(taux_contrat_projet, 2),
            'valeur_moyenne_devis': float(valeur_moyenne_devis),
            'valeur_moyenne_projet': float(valeur_moyenne_projet)
        }

    @staticmethod
    def get_project_devis_details(project_id):
        """
        Obtenir tous les détails de traçabilité pour un projet
        """
        from projects.models import Project

        try:
            project = Project.objects.get(id=project_id)

            if not project.contract:
                return {'error': 'Aucun contrat associé'}

            contrat = project.contract
            devis_list = list(contrat.devis.all())

            # Tâches créées depuis les lignes de devis
            tasks_from_devis = project.tasks.filter(
                ligne_devis__isnull=False
            )

            # Statistiques par devis
            devis_stats = []
            for devis in devis_list:
                lignes = devis.lignes.all()
                tasks_count = tasks_from_devis.filter(
                    ligne_devis__in=lignes
                ).count()

                devis_stats.append({
                    'numero': devis.numero,
                    'montant_ttc': float(devis.montant_ttc),
                    'lignes_count': lignes.count(),
                    'tasks_generees': tasks_count
                })

            return {
                'project_id': project.id,
                'project_title': project.title,
                'contrat_numero': contrat.numero,
                'devis': devis_stats,
                'total_tasks': project.tasks.count(),
                'tasks_from_devis': tasks_from_devis.count(),
                'completion_rate': project.progress
            }

        except Project.DoesNotExist:
            return {'error': 'Projet introuvable'}
```

---

### 6. **Interface de Gestion dans le Frontend**

#### Page de Conversion

```typescript
// frontend/src/pages/ConversionDashboard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, FileCheck, Briefcase, TrendingUp } from 'lucide-react';

export const ConversionDashboard = () => {
  // Récupérer les metrics via API
  const metrics = {
    total_devis: 150,
    devis_acceptes: 75,
    contrats_avec_projet: 60,
    projets_actifs: 45,
    taux_conversion_devis_contrat: 50,
    taux_conversion_contrat_projet: 80,
    valeur_moyenne_devis: 25000,
    valeur_moyenne_projet: 28000
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pipeline Devis → Projets</h1>

      {/* Funnel de Conversion */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_devis}</div>
            <p className="text-xs text-muted-foreground">Total créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptés</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.devis_acceptes}</div>
            <Progress value={metrics.taux_conversion_devis_contrat} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.taux_conversion_devis_contrat}% de conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrats → Projets</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.contrats_avec_projet}</div>
            <Progress value={metrics.taux_conversion_contrat_projet} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.taux_conversion_contrat_projet}% de conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.projets_actifs}</div>
            <p className="text-xs text-muted-foreground">En cours d'exécution</p>
          </CardContent>
        </Card>
      </div>

      {/* Valeurs Moyennes */}
      <Card>
        <CardHeader>
          <CardTitle>Valeurs Moyennes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Devis Moyen</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF'
                }).format(metrics.valeur_moyenne_devis)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Budget Projet Moyen</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF'
                }).format(metrics.valeur_moyenne_projet)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🚀 Plan d'Implémentation

### Phase 1: Backend (1 semaine)
- [ ] Ajouter la méthode `creer_projet_depuis_contrat()` au modèle Contrat
- [ ] Créer l'endpoint API `/contrats/{id}/creer_projet/`
- [ ] Ajouter les signaux de synchronisation
- [ ] Créer le service `ProjectAnalyticsService`
- [ ] Tests unitaires

### Phase 2: Frontend (1 semaine)
- [ ] Créer le composant `ContratToProjectButton`
- [ ] Créer le composant `ProjectTraceability`
- [ ] Créer la page `ConversionDashboard`
- [ ] Intégrer dans les pages existantes

### Phase 3: Tests & Documentation (3 jours)
- [ ] Tests end-to-end du flux complet
- [ ] Documentation utilisateur
- [ ] Formation équipe

---

## 📈 Bénéfices Attendus

1. **Gain de Temps**
   - Création automatique de projets: -70% de temps
   - Génération automatique de tâches: -80% de temps
   - Plus d'erreurs de saisie manuelle

2. **Traçabilité Complète**
   - Lien clair Devis → Contrat → Projet
   - Audit trail complet
   - Conformité améliorée

3. **Meilleure Visibilité**
   - Dashboard de conversion
   - Métriques claires
   - Identification des goulots d'étranglement

4. **Satisfaction Client**
   - Démarrage projet plus rapide
   - Cohérence garantie
   - Professionnalisme renforcé

---

*Document créé le : 2025-11-29*
*Auteur : Claude AI - Assistant Technique*
