import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from "lucide-react";
import { useFactures } from "@/hooks/use-factures";

interface Facture {
  id: number;
  numero: string;
  client_nom: string;
  client_nom_complet?: string;
  date_emission: string;
  date_echeance: string;
  montant_ttc: number;
  montant_restant: number;
  statut: string;
}

interface FactureImpayeModalProps {
  open: boolean;
  onClose: () => void;
}

const FactureImpayeModal: React.FC<FactureImpayeModalProps> = ({
  open,
  onClose,
}) => {
  const { loading, error, fetchFacturesImpayees } = useFactures();
  const [facturesImpayees, setFacturesImpayees] = useState<Facture[]>([]);
  useEffect(() => {
    if (open) {
      fetchFacturesImpayees().then((data) => {
        console.log(data);
        setFacturesImpayees(data);
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Factures impayées</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement des factures...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 py-8 text-center bg-red-50 rounded-lg">
            <p className="font-medium">Erreur lors du chargement</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : facturesImpayees?.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-lg">Aucune facture impayée trouvée</p>
            <p className="text-sm mt-1">Toutes les factures sont à jour</p>
          </div>
        ) : (
                    <div className="overflow-auto max-h-96 border rounded-lg">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="bg-gray-50 border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700 w-20">N° Facture</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Client</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700 w-28">Date émission</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700 w-28">Date échéance</th>
                  <th className="h-12 px-4 text-right align-middle font-semibold text-gray-700 w-32">Montant TTC</th>
                  <th className="h-12 px-4 text-right align-middle font-semibold text-gray-700 w-32">Montant restant</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700 w-24">Statut</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {facturesImpayees?.map((facture, index) => (
                  <tr key={facture.id} className={`border-b transition-colors hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="p-4 align-middle font-medium text-blue-600">{facture.numero}</td>
                    <td className="p-4 align-middle max-w-48 truncate font-medium">{facture.client_nom}</td>
                    <td className="p-4 align-middle text-sm text-gray-600">
                      {facture.date_emission
                        ? new Date(facture.date_emission).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="p-4 align-middle text-sm text-gray-600">
                      {facture.date_echeance
                        ? new Date(facture.date_echeance).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="p-4 align-middle text-right font-medium text-gray-800">
                      {facture.montant_ttc?.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "GNF",
                      }) || "-"}
                    </td>
                    <td className="p-4 align-middle text-right font-bold text-red-600">
                      {facture.montant_restant?.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "GNF",
                      }) || "-"}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        facture.statut === 'en_retard' ? 'bg-red-100 text-red-800 border border-red-200' :
                        facture.statut === 'partiellement_payee' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        facture.statut === 'emise' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {facture.statut?.replace('_', ' ').toUpperCase() || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <DialogFooter className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-600">
              {facturesImpayees?.length > 0 && (
                <span>Total: {facturesImpayees.length} facture{facturesImpayees.length > 1 ? 's' : ''} impayée{facturesImpayees.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <Button onClick={onClose} variant="default" className="px-6">
              Fermer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FactureImpayeModal;
