import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileSpreadsheet, Check, X, Tag, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';

import {activitiesAPI} from '@/lib/api';

interface Service {
  id: number;
  name: string;
}

interface ImportActivityData {
  name: string;
  duree_standard: number;
  service_id?: number | null;
  is_active: boolean;
}

interface ImportActivityRawData {
  name: string;
  description?: string;
  duree_standard: number;
  service?: string;
}

interface ImportActivitiesModalProps {
  open: boolean;
  onClose: () => void;
  services: Service[];
  onImportSuccess: (activities: ImportActivityData[]) => Promise<void>;
}

export function ImportActivitiesModal({
  open,
  onClose,
  services,
  onImportSuccess
}: ImportActivitiesModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRawData, setImportRawData] = useState<ImportActivityRawData[]>([]);
  const [importData, setImportData] = useState<ImportActivityData[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importingStatus, setImportingStatus] = useState<'idle' | 'parsing' | 'importing'>('idle');
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [serviceCounts, setServiceCounts] = useState<Record<string | number, number>>({});

  const parseExcelFile = async (file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          setImportingStatus('parsing');
          setImportErrors([]);
          setImportRawData([]);
          setImportData([]);

          const arrayBuffer = event.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error('Impossible de lire le fichier');
          }

          const workbook = XLSX.read(arrayBuffer);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];

          if (!worksheet) {
            throw new Error('Aucune feuille de calcul trouvée');
          }
          // const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportActivityRawData[];
          const rawData = XLSX.utils.sheet_to_json(worksheet) as ImportActivityRawData[];

          if (rawData.length === 0) {
            throw new Error('Le fichier Excel est vide');
          }

          const errors: string[] = [];
          const parsed: ImportActivityRawData[] = rawData;
          // .filter(row => {
          //   const rowNum = rawData.indexOf(row) + 2;
          //   const name = (row.name || '').toString().trim();
          //   const durationStr = (row.duree_standard || '0').toString().trim();

          //   if (!name) {
          //     errors.push(`Ligne ${rowNum}: Le nom de l'activité est requis`);
          //     return false;
          //   }

          //   const duration = parseFloat(durationStr);
          //   if (isNaN(duration) || duration <= 0) {
          //     errors.push(`Ligne ${rowNum}: La durée doit être un nombre positif`);
          //     return false;
          //   }

          //   return true;
          // });

          setImportRawData(parsed);
          setImportErrors(errors);

          const initialServices: ImportActivityData[] = parsed.map(row => ({
            name: row.name,
            duree_standard: row.duree_standard,
            service_id: null,
            is_active: true
          }));

          setImportData(initialServices);

          if (parsed.length > 0) {
            setImportStep('preview');
          }
          setImportingStatus('idle');

          if (parsed.length === 0 && errors.length === 0) {
            setImportErrors(['Aucune ligne valide trouvée']);
          }

          resolve();
        } catch (err: any) {
          setImportErrors([err.message || 'Erreur lors de la lecture du fichier']);
          setImportingStatus('idle');
          resolve();
        }
      };

      reader.onerror = () => {
        setImportErrors(['Erreur lors de la lecture du fichier']);
        setImportingStatus('idle');
        resolve();
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const newImportData = [...importData];
    newImportData[index].service_id = serviceId === 'none' ? null : parseInt(serviceId);
    setImportData(newImportData);

    const counts: Record<string | number, number> = {};
    counts['none'] = 0;
    newImportData.forEach((service) => {
      const key = service.service_id || 'none';
      counts[key] = (counts[key] || 0) + 1;
    });
    setServiceCounts(counts);
  };

  const unassignedCount = importData.filter(service => !service.service_id).length;

  const submitImport = async () => {
    if (importData.length === 0) {
      toast.error('Aucune donnée à importer');
      return;
    }

    if (unassignedCount > 0) {
      toast.error('Toutes les activités doivent avoir un service assigné');
      return;
    }

    setImportStep('importing');
    setImportingStatus('importing');

    try {
      // Construire les données pour le backend
      const activitiesData = importData.map((activity) => ({
        name: activity.name,
        duree_standard: activity.duree_standard,
        service_id: activity.service_id,
        is_active: activity.is_active,
      }));

      // Envoyer au backend
      const response = await activitiesAPI.bulkimportActivities(activitiesData);
  
      const { success_count, error_count, imported_activities, errors } = response.data;

      // Afficher les résultats
      if (success_count > 0) {
        toast.success(`${success_count} activité(s) importée(s) avec succès`);
      }

      if (error_count > 0) {
        const errorMessages = errors.map((err: any) => 
          `Ligne ${err.index + 1} (${err.name || 'Activité'}): ${err.error}`
        ).join('\n');
        
        toast.error(`${error_count} activité(s) n'ont pas pu être importées`, {
          description: errorMessages.substring(0, 200) + (errorMessages.length > 200 ? '...' : '')
        });
      }

      // Appeler le callback de succès
      await onImportSuccess(importData);
      handleCloseImportDialog();
    } catch (err: any) {
      setImportingStatus('idle');
      setImportStep('preview');
      
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de l\'import des activités';
      
      toast.error(errorMessage);
      console.error('Erreur import:', err);
    }
  };

  const handleCloseImportDialog = () => {
    setImportFile(null);
    setImportRawData([]);
    setImportData([]);
    setImportErrors([]);
    setImportStep('upload');
    setImportingStatus('idle');
    setServiceCounts({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleCloseImportDialog();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={20} />
            Import Excel - Activités
          </DialogTitle>
        </DialogHeader>

        {importStep === 'upload' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Sélectionnez un fichier Excel (.xlsx ou .xls) contenant vos activités.</p>
              <p className="mt-2">Format attendu :</p>
              <ul className="list-disc list-inside mt-1 ml-4">
                <li><strong>name</strong> : Nom de l'activité</li>
                <li><strong>duree_standard</strong> : Durée standard en heures</li>
                <li><strong>service</strong> : Nom du service (optionnel)</li>
                <li><strong>description</strong> : Description (optionnel)</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.name.match(/\.(xlsx|xls)$/)) {
                      toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
                      return;
                    }
                    setImportFile(file);
                    await parseExcelFile(file);
                  }
                }}
                className="hidden"
                id="excel-upload-activities"
                disabled={importingStatus === 'parsing'}
              />
              <label
                htmlFor="excel-upload-activities"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {importingStatus === 'parsing' ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Lecture du fichier...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Cliquez pour sélectionner un fichier Excel
                    </span>
                    <span className="text-xs text-gray-500">
                      Formats supportés: .xlsx, .xls
                    </span>
                  </>
                )}
              </label>
            </div>

            {importFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check size={16} />
                <span>Fichier sélectionné : {importFile.name}</span>
              </div>
            )}
          </div>
        )}

        {importStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Prévisualisation - {importRawData.length} activité(s) trouvée(s)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportStep('upload');
                  setImportFile(null);
                }}
                disabled={importingStatus === 'importing'}
              >
                <X size={16} className="mr-2" />
                Changer de fichier
              </Button>
            </div>

            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              <p>⚠️ Veuillez vérifier et assigner un service à chaque activité avant l'import.</p>
            </div>

            {unassignedCount > 0 && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erreur : {unassignedCount} activité(s) sans service</p>
                  <p className="text-red-600 mt-1">Toutes les activités doivent être assignées à un service avant l'import.</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} className="text-blue-600" />
                <h4 className="font-semibold text-blue-900">Résumé de l'import</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-200 bg-blue-100">
                      <th className="text-left px-3 py-2 font-semibold text-blue-900">Indicateur</th>
                      <th className="text-center px-3 py-2 font-semibold text-blue-900">Valeur</th>
                      <th className="text-center px-3 py-2 font-semibold text-blue-900">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-blue-100 hover:bg-blue-100">
                      <td className="px-3 py-2 text-gray-700">Activités trouvées</td>
                      <td className="text-center px-3 py-2 font-bold text-blue-600">{importRawData.length}</td>
                      <td className="text-center px-3 py-2">
                        <Badge variant={importRawData.length > 0 ? "default" : "secondary"}>
                          {importRawData.length > 0 ? "✓" : "—"}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-blue-100 hover:bg-blue-100">
                      <td className="px-3 py-2 text-gray-700">Service assigné</td>
                      <td className="text-center px-3 py-2 font-bold text-green-600">
                        {importData.filter(a => a.service_id).length}/{importData.length}
                      </td>
                      <td className="text-center px-3 py-2">
                        <Badge variant={unassignedCount === 0 && importData.length > 0 ? "default" : "destructive"}>
                          {unassignedCount === 0 && importData.length > 0 ? "✓" : unassignedCount > 0 ? "✗" : "—"}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-blue-100 hover:bg-blue-100">
                      <td className="px-3 py-2 text-gray-700">Erreurs</td>
                      <td className="text-center px-3 py-2 font-bold text-red-600">{importErrors.length}</td>
                      <td className="text-center px-3 py-2">
                        <Badge variant={importErrors.length === 0 ? "default" : "destructive"}>
                          {importErrors.length === 0 ? "✓" : "✗"}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="hover:bg-blue-100">
                      <td className="px-3 py-2 text-gray-700">Prêt pour l'import</td>
                      <td className="text-center px-3 py-2 font-bold text-purple-600">
                        {unassignedCount === 0 && importData.length > 0 && importErrors.length === 0 ? "Oui" : "Non"}
                      </td>
                      <td className="text-center px-3 py-2">
                        <Badge variant={unassignedCount === 0 && importData.length > 0 && importErrors.length === 0 ? "default" : "secondary"}>
                          {unassignedCount === 0 && importData.length > 0 && importErrors.length === 0 ? "✓" : "—"}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Durée (h)</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importRawData.map((row, index) => {
                    const isUnassigned = !importData[index]?.service_id;
                    return (
                      <TableRow
                        key={index}
                        className={isUnassigned ? 'bg-red-50 hover:bg-red-100' : ''}
                      >
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.duree_standard}</TableCell>
                        <TableCell>
                          <select
                            value={importData[index]?.service_id?.toString() || 'none'}
                            onChange={(e) => handleServiceChange(index, e.target.value)}
                            className={`w-40 border rounded px-2 py-1 text-sm ${
                              isUnassigned ? 'border-red-500 bg-red-100' : ''
                            }`}
                          >
                            <option value="none">Aucun service</option>
                            {services.map((service) => (
                              <option key={service.id} value={service.id.toString()}>
                                {service.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          {isUnassigned ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertCircle size={14} />
                              Non assignée
                            </Badge>
                          ) : (
                            <Badge variant={importData[index]?.is_active ? "default" : "secondary"}>
                              {importData[index]?.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {importErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm font-medium text-red-700 mb-2">Erreurs rencontrées :</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {importStep === 'importing' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <h3 className="text-lg font-medium">Import en cours...</h3>
            <p className="text-sm text-gray-600">
              Veuillez patienter pendant l'import des activités.
            </p>
          </div>
        )}

        <DialogFooter>
          {importStep === 'upload' && (
            <Button variant="outline" onClick={handleCloseImportDialog}>
              Annuler
            </Button>
          )}

          {importStep === 'preview' && (
            <>
              <Button variant="outline" onClick={handleCloseImportDialog}>
                Annuler
              </Button>
              <Button
                onClick={submitImport}
                disabled={importingStatus === 'importing' || unassignedCount > 0}
              >
                {importingStatus === 'importing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : unassignedCount > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Importer {importData.length} activité(s) - {unassignedCount} non assignée(s)
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Importer {importData.length} activité(s)
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
