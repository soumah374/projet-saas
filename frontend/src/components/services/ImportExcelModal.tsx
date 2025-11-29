import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileSpreadsheet, Check, X, Tag, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useBulkImportServices } from '@/hooks/use-services';
import * as XLSX from 'xlsx';
interface Category {
  id: number;
  name: string;
}

interface ImportService {
  name: string;
  description: string;
  category_id?: number | null;
  is_active: boolean;
}

interface ExcelRow {
  name: string;
  description: string;
  price?: string | number;
  duration?: string | number;
  category?: string;
  status?: string;
}

interface ImportExcelModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onImportSuccess: () => void;
}

export function ImportExcelModal({ open, onClose, categories, onImportSuccess }: ImportExcelModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ExcelRow[]>([]);
  const [importServices, setImportServices] = useState<ImportService[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  
  const bulkImportServices = useBulkImportServices();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setImportFile(file);
    readExcelFile(file);
  };

  const readExcelFile = (file: File) => {
    setImportLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Note: This would work with the xlsx library
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
        
        // Pour le moment, simulons des données d'exemple
        const simulatedData: ExcelRow[] = jsonData;
        
        setImportData(simulatedData);
        
        // Initialiser les services d'import avec des valeurs par défaut
        const initialServices: ImportService[] = simulatedData.map(row => ({
          name: row.name || '',
          description: row.description || '',
          category_id: null, // L'utilisateur devra choisir
          is_active: row.status === 'active' || row.status !== 'inactive'
        }));
        
        setImportServices(initialServices);
        setImportStep('preview');
        
      } catch (error) {
        toast.error('Erreur lors de la lecture du fichier Excel');
        console.error('Error reading Excel file:', error);
      } finally {
        setImportLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    const newImportServices = [...importServices];
    newImportServices[index].category_id = categoryId === 'none' ? null : parseInt(categoryId);
    setImportServices(newImportServices);
  };

  // Calculer le nombre de lignes associées à chaque catégorie
  const categoryCounts = useMemo(() => {
    const counts: Record<string | number, number> = {};
    counts['none'] = 0;
    
    importServices.forEach((service) => {
      const categoryKey = service.category_id || 'none';
      counts[categoryKey] = (counts[categoryKey] || 0) + 1;
    });
    
    return counts;
  }, [importServices]);

  // Calculer le nombre de lignes sans catégorie
  const unassignedCount = useMemo(() => {
    return importServices.filter(service => !service.category_id).length;
  }, [importServices]);

  const handleImportServices = async () => {
    setImportStep('importing');
    setImportLoading(true);
    
    try {
      const validServices = importServices.filter(service => 
        service.name.trim() && service.description.trim()
      );
      
      if (validServices.length === 0) {
        toast.error('Aucune prestation valide à importer');
        return;
      }

      // Utiliser l'endpoint d'import en lot
      // Appel de l'endpoint d'import en lot, qui retourne un objet avec les résultats
      const response = await bulkImportServices.mutateAsync({ services: validServices });
      const { success_count, error_count, errors } = response;

      console.log(response);
      
      if (success_count > 0) {
        toast.success(`${success_count} prestation(s) importée(s) avec succès`);
        onImportSuccess(); // Recharger la liste
      }
      
      if (error_count > 0) {
        // Afficher les erreurs détaillées
        const errorMessages = errors.map((err: any) => 
          `Ligne ${err.index + 1} (${err.name || 'Prestation'}): ${err.error}`
        ).join('\n');
        
        toast.error(`${error_count} prestation(s) n'ont pas pu être importées:\n${errorMessages}`, {
          duration: 10000 // Afficher plus longtemps pour les erreurs détaillées
        });
      }
      
      // Fermer le dialogue d'import
      handleCloseImportDialog();
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'import des prestations';
      toast.error(errorMessage);
      console.error('Import error:', error);
    } finally {
      setImportLoading(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportFile(null);
    setImportData([]);
    setImportServices([]);
    setImportStep('upload');
    setImportLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseImportDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={20} />
            Import Excel - Services
          </DialogTitle>
        </DialogHeader>
        
        {importStep === 'upload' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Sélectionnez un fichier Excel (.xlsx ou .xls) contenant vos prestations.</p>
              <p className="mt-2">Format attendu :</p>
              <ul className="list-disc list-inside mt-1 ml-4">
                <li><strong>name</strong> : Nom de la prestation</li>
                <li><strong>description</strong> : Description de la prestation</li>
                <li><strong>category</strong> : Nom de la catégorie (optionnel)</li>
                <li><strong>status</strong> : active/inactive (optionnel, défaut: active)</li>
              </ul>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
                disabled={importLoading}
              />
              <label
                htmlFor="excel-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {importLoading ? (
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
                Prévisualisation - {importData.length} prestation(s) trouvée(s)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportStep('upload')}
                disabled={importLoading}
              >
                <X size={16} className="mr-2" />
                Changer de fichier
              </Button>
            </div>
            
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
              <p>⚠️ Veuillez vérifier et assigner une catégorie à chaque prestation avant l'import.</p>
            </div>

            {/* Avertissement si des lignes ne sont pas assignées */}
            {unassignedCount > 0 && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erreur : {unassignedCount} prestation(s) sans catégorie</p>
                  <p className="text-red-600 mt-1">Toutes les prestations doivent être assignées à une catégorie avant l'import.</p>
                </div>
              </div>
            )}

            {/* Résumé des catégories avec compteurs */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} className="text-blue-600" />
                <h4 className="font-semibold text-blue-900">Résumé par catégorie</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <div className="bg-white border border-blue-100 rounded p-3 text-center">
                  <p className="text-xs text-gray-600">Aucune catégorie</p>
                  <p className="text-2xl font-bold text-blue-600">{categoryCounts['none'] || 0}</p>
                  <p className="text-xs text-gray-500">ligne(s)</p>
                </div>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white border border-blue-100 rounded p-3 text-center hover:border-blue-300 transition-colors"
                  >
                    <p className="text-xs text-gray-600 truncate">{category.name}</p>
                    <p className="text-2xl font-bold text-green-600">{categoryCounts[category.id] || 0}</p>
                    <p className="text-xs text-gray-500">ligne(s)</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.map((row, index) => {
                    const isUnassigned = !importServices[index]?.category_id;
                    return (
                    <TableRow 
                      key={index}
                      className={isUnassigned ? 'bg-red-50 hover:bg-red-100' : ''}
                    >
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                      <TableCell>
                        <Select
                          value={importServices[index]?.category_id?.toString() || 'none'}
                          onValueChange={(value) => handleCategoryChange(index, value)}
                        >
                          <SelectTrigger className={`w-40 ${isUnassigned ? 'border-red-500 bg-red-100' : ''}`}>
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              Aucune catégorie {categoryCounts['none'] ? `(${categoryCounts['none']})` : ''}
                            </SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name} {categoryCounts[category.id] ? `(${categoryCounts[category.id]})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {isUnassigned ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertCircle size={14} />
                            Non assignée
                          </Badge>
                        ) : (
                          <Badge variant={importServices[index]?.is_active ? "default" : "secondary"}>
                            {importServices[index]?.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {importStep === 'importing' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <h3 className="text-lg font-medium">Import en cours...</h3>
            <p className="text-sm text-gray-600">
              Veuillez patienter pendant l'import des prestations.
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
                onClick={handleImportServices}
                disabled={importLoading || unassignedCount > 0}
              >
                {importLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : unassignedCount > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Importer {importServices.length} prestation(s) - {unassignedCount} non assignée(s)
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Importer {importServices.length} prestation(s)
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
