import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, Image, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DataExportProps {
  data?: any;
  chartRefs?: Record<string, React.RefObject<HTMLDivElement>>;
  fileName?: string;
}

type ExportFormat = 'excel' | 'csv' | 'pdf' | 'png';

interface ExportOption {
  id: string;
  label: string;
  checked: boolean;
}

export const DataExport: React.FC<DataExportProps> = ({
  data,
  chartRefs,
  fileName = 'dashboard-export',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedSections, setSelectedSections] = useState<ExportOption[]>([
    { id: 'kpis', label: 'KPIs', checked: true },
    { id: 'charts', label: 'Graphiques', checked: true },
    { id: 'tables', label: 'Tableaux de données', checked: true },
    { id: 'summary', label: 'Résumé', checked: true },
  ]);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, checked: !section.checked } : section
      )
    );
  };

  const exportToExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Export KPIs
      if (selectedSections.find((s) => s.id === 'kpis')?.checked && data?.kpis) {
        const kpiData = Object.entries(data.kpis).map(([key, value]: [string, any]) => ({
          Indicateur: key,
          Valeur: value.value || value,
          Tendance: value.trend || 'N/A',
          Période: value.period || 'N/A',
        }));
        const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
      }

      // Export Revenue Data
      if (selectedSections.find((s) => s.id === 'tables')?.checked && data?.revenue_trend) {
        const revenueData = data.revenue_trend.map((item: any) => ({
          Période: item.period,
          Recettes: item.recettes,
          Dépenses: item.depenses || 0,
          'Marge Nette': (item.recettes || 0) - (item.depenses || 0),
        }));
        const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Recettes');
      }

      // Export Project Data
      if (selectedSections.find((s) => s.id === 'tables')?.checked && data?.projects) {
        const projectData = data.projects.map((project: any) => ({
          Nom: project.name,
          Statut: project.status,
          'Date de début': project.start_date,
          'Date de fin': project.end_date,
          Progression: `${project.progress}%`,
          Budget: project.budget,
        }));
        const projectSheet = XLSX.utils.json_to_sheet(projectData);
        XLSX.utils.book_append_sheet(workbook, projectSheet, 'Projets');
      }

      // Export Team Performance
      if (selectedSections.find((s) => s.id === 'tables')?.checked && data?.team_performance) {
        const teamData = data.team_performance.map((team: any) => ({
          Équipe: team.team_name,
          'Nombre de projets': team.project_count,
          'Progression moyenne': `${team.avg_progress}%`,
        }));
        const teamSheet = XLSX.utils.json_to_sheet(teamData);
        XLSX.utils.book_append_sheet(workbook, teamSheet, 'Performance Équipes');
      }

      // Export Summary
      if (selectedSections.find((s) => s.id === 'summary')?.checked) {
        const summaryData = [
          { Métrique: 'Total Projets', Valeur: data?.total_projects || 0 },
          { Métrique: 'Projets Actifs', Valeur: data?.active_projects || 0 },
          { Métrique: 'Revenus Totaux', Valeur: data?.total_revenue || 0 },
          { Métrique: 'Clients Actifs', Valeur: data?.active_clients || 0 },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');
      }

      // Generate and download
      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToCSV = async () => {
    try {
      let csvContent = '';

      // Export KPIs
      if (selectedSections.find((s) => s.id === 'kpis')?.checked && data?.kpis) {
        csvContent += 'KPIs\n';
        csvContent += 'Indicateur,Valeur,Tendance,Période\n';
        Object.entries(data.kpis).forEach(([key, value]: [string, any]) => {
          csvContent += `${key},${value.value || value},${value.trend || 'N/A'},${value.period || 'N/A'}\n`;
        });
        csvContent += '\n';
      }

      // Export Revenue Data
      if (selectedSections.find((s) => s.id === 'tables')?.checked && data?.revenue_trend) {
        csvContent += 'Recettes\n';
        csvContent += 'Période,Recettes,Dépenses,Marge Nette\n';
        data.revenue_trend.forEach((item: any) => {
          const margin = (item.recettes || 0) - (item.depenses || 0);
          csvContent += `${item.period},${item.recettes},${item.depenses || 0},${margin}\n`;
        });
        csvContent += '\n';
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}-${timestamp}.csv`;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Tableau de Bord - Rapport', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      const timestamp = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      pdf.text(`Généré le ${timestamp}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // KPIs Summary
      if (selectedSections.find((s) => s.id === 'kpis')?.checked && data?.kpis) {
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Indicateurs Clés de Performance', 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(75, 85, 99);
        Object.entries(data.kpis).forEach(([key, value]: [string, any]) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${key}: ${value.value || value}`, 20, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }

      // Capture charts
      if (selectedSections.find((s) => s.id === 'charts')?.checked && chartRefs) {
        for (const [chartName, chartRef] of Object.entries(chartRefs)) {
          if (chartRef.current) {
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = 20;
            }

            const canvas = await html2canvas(chartRef.current, {
              scale: 2,
              logging: false,
              useCORS: true,
            });
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 30;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, Math.min(imgHeight, 100));
            yPosition += Math.min(imgHeight, 100) + 10;
          }
        }
      }

      // Download PDF
      const pdfTimestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`${fileName}-${pdfTimestamp}.pdf`);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  const exportToImage = async (chartRef: React.RefObject<HTMLDivElement>, chartName: string) => {
    try {
      if (!chartRef.current) return;

      const canvas = await html2canvas(chartRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = canvas.toDataURL('image/png');
      link.download = `${chartName}-${timestamp}.png`;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting to image:', error);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'pdf':
          await exportToPDF();
          break;
        case 'png':
          if (chartRefs && Object.keys(chartRefs).length > 0) {
            const firstChart = Object.entries(chartRefs)[0];
            await exportToImage(firstChart[1], firstChart[0]);
          }
          break;
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export de Données
          </CardTitle>
          {exportSuccess && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Exporté !
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section selection */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Sections à exporter:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedSections.map((section) => (
              <label
                key={section.id}
                className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={section.checked}
                  onCheckedChange={() => toggleSection(section.id)}
                />
                <span className="text-sm font-medium">{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Export buttons */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Format d'export:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-4"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Excel</div>
                <div className="text-xs text-gray-500">.xlsx</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-4"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <FileText className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-500">.csv</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-4"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <FileText className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="font-medium">PDF</div>
                <div className="text-xs text-gray-500">.pdf</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto py-4"
              onClick={() => handleExport('png')}
              disabled={isExporting}
            >
              <Image className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-medium">Image</div>
                <div className="text-xs text-gray-500">.png</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Status message */}
        {isExporting && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Export en cours...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
