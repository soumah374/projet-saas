import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Target
} from 'lucide-react';
import { formatMontant } from '@/lib/formatters';
import type { Project } from '@/lib/types';
import { differenceInDays } from 'date-fns';

interface ProjectTrackingTableProps {
  project: Project;
}

interface TrackingMetrics {
  executionPercentage: number;
  daysCalculated: number;
  daysRemaining: number;
  totalTasks: number;
  completedTasks: number;
  tasksExecutionPercentage: number;
  budgetUsed: number;
  budgetTotal: number;
  budgetPercentage: number;
  margin: number;
  marginPercentage: number;
  temporalProgress: number; // Nouvelle propriété
}

export function ProjectTrackingTable({ project }: ProjectTrackingTableProps) {
  const metrics = useMemo((): TrackingMetrics => {
    const contract = project.contract_details;
    const tasks = project.tasks || [];
    
    // Calcul des métriques de base
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Terminé').length;
    const tasksExecutionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calcul des jours
    const startDate = project.start_date ? new Date(project.start_date) : null;
    const deadline = new Date(project.deadline);
    const today = new Date();
        
    const daysCalculated = startDate && deadline ? 
      Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const daysRemaining = deadline > today ? 
      Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calcul du pourcentage d'exécution global
    const executionPercentage = project.progress || 0;
    
    // Calcul de la progression temporelle
    const temporalProgress = (() => {
      if (daysCalculated > 0) {
        const daysElapsed = Math.max(0, daysCalculated - daysRemaining); 
        return Math.min(100, Math.round((daysElapsed / daysCalculated) * 100));
      }
      return 0;
    })();
    
    // Calculs budgétaires
    const budgetTotal = typeof (contract?.montant_ht || project.budget) === 'string' ? 
      parseFloat(String(contract?.montant_ht || project.budget || '0')) : 
      Number(contract?.montant_ht || project.budget || 0);
    const budgetUsed = parseFloat(project.total_hours || '0') * 100; // Estimation basée sur les heures
    const budgetPercentage = budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0;
    
    // Calcul des marges (estimation basée sur le contrat)
    const contractAmount = typeof contract?.montant_ht === 'string' ? 
      parseFloat(contract.montant_ht) : 
      Number(contract?.montant_ht || 0);
    const margin = contract ? 
      (contractAmount - budgetUsed) : 0;
    const marginPercentage = budgetTotal > 0 ? (margin / budgetTotal) * 100 : 0;
    
    return {
      executionPercentage,
      daysCalculated,
      daysRemaining,
      totalTasks,
      completedTasks,
      tasksExecutionPercentage,
      budgetUsed,
      budgetTotal,
      budgetPercentage,
      margin,
      marginPercentage,
      temporalProgress
    };
  }, [project]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Bon</Badge>;
    return <Badge className="bg-red-100 text-red-800">À améliorer</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Tableau de suivi du projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrique</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Pourcentage</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Progression globale */}
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progression globale
              </TableCell>
              <TableCell>{metrics.executionPercentage}%</TableCell>
              <TableCell>
                <Progress value={metrics.executionPercentage} className="w-24" />
              </TableCell>
              <TableCell>{getStatusBadge(metrics.executionPercentage)}</TableCell>
            </TableRow>

            {/* Durée du projet */}
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Durée du projet
              </TableCell>
              <TableCell>
                {(() => {
                  if (project.contract_details?.date_debut && project.contract_details?.date_fin) {
                    try {
                      const debut = new Date(project.contract_details.date_debut);
                      const fin = new Date(project.contract_details.date_fin);
                      const jours = differenceInDays(fin, debut);
                      if (jours > 0) {
                        return (
                          <span>{jours} jours</span>
                        );
                      }
                    } catch (e) {
                      console.log(e)
                    }
                  }
                  return null;
                })()}
                {metrics.daysRemaining > 0 && (
                  <div className="text-sm text-gray-500">
                    {metrics.daysRemaining} jours restants
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Progress 
                  value={metrics.temporalProgress} 
                  className={`w-24 ${metrics.temporalProgress > 100 ? 'bg-red-200' : ''}`} 
                />
              </TableCell>
              <TableCell>
                {metrics.daysRemaining > 0 ? 
                  <Badge className="bg-blue-100 text-blue-800">En cours</Badge> :
                  <Badge className="bg-red-100 text-red-800">En retard</Badge>
                }
              </TableCell>
            </TableRow>

            {/* Exécution des tâches */}
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Exécution des tâches
              </TableCell>
              <TableCell>
                {metrics.completedTasks} / {metrics.totalTasks} tâches
              </TableCell>
              <TableCell>
                <Progress value={metrics.tasksExecutionPercentage} className="w-24" />
              </TableCell>
              <TableCell>{getStatusBadge(metrics.tasksExecutionPercentage)}</TableCell>
            </TableRow>

            {/* Budget utilisé */}
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget utilisé
              </TableCell>
              <TableCell>
                {formatMontant(metrics.budgetUsed)} / {formatMontant(metrics.budgetTotal)}
              </TableCell>
              <TableCell>
                <Progress 
                  value={Math.min(metrics.budgetPercentage, 100)} 
                  className={`w-24 ${metrics.budgetPercentage > 100 ? 'bg-red-200' : ''}`} 
                />
              </TableCell>
              <TableCell>
                {metrics.budgetPercentage > 100 ? 
                  <Badge className="bg-red-100 text-red-800">Dépassé</Badge> :
                  <Badge className="bg-green-100 text-green-800">Dans les limites</Badge>
                }
              </TableCell>
            </TableRow>

            {/* Marges */}
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Marges
              </TableCell>
              <TableCell className={getStatusColor(metrics.marginPercentage)}>
                {formatMontant(metrics.margin)}
              </TableCell>
              <TableCell>
                <Progress 
                  value={Math.max(metrics.marginPercentage, 0)} 
                  className="w-24" 
                />
              </TableCell>
              <TableCell>
                {metrics.margin > 0 ? 
                  <Badge className="bg-green-100 text-green-800">Positive</Badge> :
                  <Badge className="bg-red-100 text-red-800">Négative</Badge>
                }
              </TableCell>
            </TableRow>

            {/* Temps restant */}
            <TableRow>
              <TableCell className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Temps restant
              </TableCell>
              <TableCell>
                {metrics.daysRemaining > 0 ? 
                  `${metrics.daysRemaining} jours` : 
                  'Projet terminé'
                }
              </TableCell>
              <TableCell>
                <Progress 
                  value={metrics.temporalProgress} 
                  className={`w-24 ${metrics.temporalProgress > 100 ? 'bg-red-200' : ''}`} 
                />
              </TableCell>
              <TableCell>
                {metrics.daysRemaining > 0 ? 
                  <Badge className="bg-blue-100 text-blue-800">En cours</Badge> :
                  <Badge className="bg-green-100 text-green-800">Terminé</Badge>
                }
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {/* Résumé des alertes */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes importantes
          </h4>
          <div className="space-y-2 text-sm">
            {metrics.daysRemaining < 0 && (
              <div className="text-red-600">⚠️ Le projet est en retard de {Math.abs(metrics.daysRemaining)} jours</div>
            )}
            {metrics.budgetPercentage > 100 && (
              <div className="text-red-600">⚠️ Le budget a été dépassé de {Math.round(metrics.budgetPercentage - 100)}%</div>
            )}
            {metrics.tasksExecutionPercentage < 50 && (
              <div className="text-yellow-600">⚠️ Moins de 50% des tâches sont terminées</div>
            )}
            {metrics.margin < 0 && (
              <div className="text-red-600">⚠️ Les marges sont négatives</div>
            )}
            {metrics.daysRemaining > 0 && metrics.budgetPercentage < 100 && metrics.tasksExecutionPercentage > 50 && (
              <div className="text-green-600">✅ Le projet progresse bien</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 