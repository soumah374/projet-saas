import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
  Target,
  Clock
} from "lucide-react";

interface ReportData {
  projects: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  team: {
    total: number;
    active: number;
    productivity: number;
  };
  timeline: {
    labels: string[];
    data: number[];
  };
  performance: {
    labels: string[];
    data: number[];
  };
}

export function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    // Simuler le chargement des données de rapport
    const mockData: ReportData = {
      projects: {
        total: 12,
        active: 8,
        completed: 3,
        delayed: 1
      },
      tasks: {
        total: 156,
        completed: 89,
        pending: 45,
        overdue: 22
      },
      team: {
        total: 15,
        active: 12,
        productivity: 87
      },
      timeline: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        data: [65, 78, 82, 75, 90, 85]
      },
      performance: {
        labels: ['Développement', 'Design', 'QA', 'DevOps'],
        data: [85, 72, 90, 78]
      }
    };

    setReportData(mockData);
  }, []);

  const getCompletionRate = () => {
    if (!reportData) return 0;
    return Math.round((reportData.tasks.completed / reportData.tasks.total) * 100);
  };

  const getProjectSuccessRate = () => {
    if (!reportData) return 0;
    return Math.round((reportData.projects.completed / reportData.projects.total) * 100);
  };

  const getOverdueRate = () => {
    if (!reportData) return 0;
    return Math.round((reportData.tasks.overdue / reportData.tasks.total) * 100);
  };

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-600">
            Analysez les performances et la productivité de votre équipe
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtres</span>
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type de rapport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Vue d'ensemble</SelectItem>
                <SelectItem value="projects">Rapport projets</SelectItem>
                <SelectItem value="team">Rapport équipe</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Période: {timeRange}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Type: {reportType}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Équipe: Toutes</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Projets: Tous</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets totaux</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.projects.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>+12% ce mois</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Actifs</span>
                <span className="text-blue-600">{reportData.projects.active}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Terminés</span>
                <span className="text-green-600">{reportData.projects.completed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>En retard</span>
                <span className="text-red-600">{reportData.projects.delayed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.tasks.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>Taux de complétion: {getCompletionRate()}%</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Terminées</span>
                <span className="text-green-600">{reportData.tasks.completed}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>En attente</span>
                <span className="text-yellow-600">{reportData.tasks.pending}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>En retard</span>
                <span className="text-red-600">{reportData.tasks.overdue}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.team.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Target className="w-3 h-3 text-blue-500" />
              <span>Productivité: {reportData.team.productivity}%</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Actifs</span>
                <span className="text-green-600">{reportData.team.active}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>En congé</span>
                <span className="text-gray-600">{reportData.team.total - reportData.team.active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getProjectSuccessRate()}%</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 text-orange-500" />
              <span>Retard: {getOverdueRate()}%</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>À temps</span>
                <span className="text-green-600">{100 - getOverdueRate()}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>En retard</span>
                <span className="text-red-600">{getOverdueRate()}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution temporelle */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la productivité</CardTitle>
            <CardDescription>
              Progression de la productivité sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Graphique d'évolution</p>
                <p className="text-sm">Intégration des graphiques en cours</p>
                <div className="mt-4 space-y-2">
                  {reportData.timeline.labels.map((label, index) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{reportData.timeline.data[index]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance par département */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par département</CardTitle>
            <CardDescription>
              Taux de réussite par équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-2" />
                <p>Graphique circulaire</p>
                <p className="text-sm">Intégration des graphiques en cours</p>
                <div className="mt-4 space-y-2">
                  {reportData.performance.labels.map((label, index) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{reportData.performance.data[index]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des projets</CardTitle>
          <CardDescription>
            Vue détaillée de tous les projets et leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Projet</th>
                  <th className="text-left p-2">Chef de projet</th>
                  <th className="text-left p-2">Statut</th>
                  <th className="text-left p-2">Progression</th>
                  <th className="text-left p-2">Échéance</th>
                  <th className="text-left p-2">Équipe</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Refonte du site web</td>
                  <td className="p-2">Marie Dupont</td>
                  <td className="p-2">
                    <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
                  </td>
                  <td className="p-2">75%</td>
                  <td className="p-2">15 Fév 2024</td>
                  <td className="p-2">5 membres</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Application mobile</td>
                  <td className="p-2">Jean Martin</td>
                  <td className="p-2">
                    <Badge className="bg-gray-100 text-gray-800">Planifié</Badge>
                  </td>
                  <td className="p-2">25%</td>
                  <td className="p-2">20 Mar 2024</td>
                  <td className="p-2">8 membres</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Base de données</td>
                  <td className="p-2">Sophie Bernard</td>
                  <td className="p-2">
                    <Badge className="bg-blue-100 text-blue-800">Terminé</Badge>
                  </td>
                  <td className="p-2">100%</td>
                  <td className="p-2">30 Jan 2024</td>
                  <td className="p-2">3 membres</td>
                </tr>
                <tr>
                  <td className="p-2">Système de paiement</td>
                  <td className="p-2">Pierre Durand</td>
                  <td className="p-2">
                    <Badge className="bg-red-100 text-red-800">En retard</Badge>
                  </td>
                  <td className="p-2">60%</td>
                  <td className="p-2">10 Mar 2024</td>
                  <td className="p-2">6 membres</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Générez des rapports spécifiques ou exportez les données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Download className="w-6 h-6" />
              <span>Exporter PDF</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BarChart3 className="w-6 h-6" />
              <span>Rapport détaillé</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="w-6 h-6" />
              <span>Analyse tendances</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 