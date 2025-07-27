import React, { useRef, useState } from 'react';
import { formatDate, formatMontant, formatTemps } from '@/lib/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEnvoyerEmailPDF } from '@/hooks/use-devis';

interface PDFExportProps {
  devis: any;
  onClose: () => void;
}

export const PDFExport: React.FC<PDFExportProps> = ({ devis, onClose }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email_destinataire: devis?.client?.email || '',
    sujet: `Devis ${devis?.numero} - ${devis?.client?.nom_complet}`,
    message: ''
  });

  const envoyerEmailPDFMutation = useEnvoyerEmailPDF();

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async (): Promise<string | null> => {
    if (!pdfRef.current) return null;

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Retourner le PDF en base64
      return pdf.output('datauristring');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    const pdfData = await generatePDF();
    if (pdfData) {
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = `devis-${devis.numero}.pdf`;
      link.click();
    }
  };

  const handleSendEmail = async () => {
    try {
      const pdfData = await generatePDF();
      if (!pdfData) {
        toast.error('Erreur lors de la génération du PDF');
        return;
      }

      await envoyerEmailPDFMutation.mutateAsync({
        id: devis.id,
        data: {
          email_destinataire: emailForm.email_destinataire,
          sujet: emailForm.sujet,
          message: emailForm.message,
          pdf_data: pdfData
        }
      });

      setEmailDialogOpen(false);
      setEmailForm({
        email_destinataire: devis?.client?.email || '',
        sujet: `Devis ${devis?.numero} - ${devis?.client?.nom_complet}`,
        message: ''
      });
    } catch (error) {
      // L'erreur est gérée par le hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header avec actions */}
        <div className="flex items-center justify-between p-4 border-b print-actions">
          <h2 className="text-xl font-semibold">Export PDF - Devis {devis.numero}</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Imprimer
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Télécharger PDF
            </button>
            <button
              onClick={() => setEmailDialogOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
            >
              <Mail size={16} />
              Envoyer par email
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Contenu PDF */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div 
            ref={pdfRef} 
            className="bg-white w-[794px] mx-auto shadow-lg"
            style={{ 
              minHeight: '1123px',
              padding: '20px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              lineHeight: '1.4',
              color: '#1a202c'
            }}
          >
            {/* En-tête avec logo et informations */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '30px',
              borderBottom: '3px solid #2563eb',
              paddingBottom: '15px'
            }}>
              {/* Logo et services */}
              <div style={{ flex: '1' }}>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#2563eb',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#2563eb' }}>sa</span>
                  <span style={{ color: '#6b7280' }}>k</span>
                  <span style={{ color: '#2563eb' }}>om</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2px',
                  fontSize: '10px',
                  color: '#4a5568'
                }}>
                  <div>Communication</div>
                  <div>Relations publiques</div>
                  <div>Évènementiel</div>
                  <div>Production Audiovisuelle</div>
                </div>
              </div>

              {/* Titre du document */}
              <div style={{ 
                flex: '2', 
                textAlign: 'center',
                marginTop: '10px'
              }}>
                <h1 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  margin: '0 0 10px 0',
                  color: '#1a202c'
                }}>
                  Facture Proforma
                </h1>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#2d3748'
                }}>
                  N° {devis.numero}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: '#4a5568',
                  marginTop: '5px'
                }}>
                  Date: {formatDate(devis.date_creation)}
                </div>
              </div>

              {/* Informations client */}
              <div style={{ 
                flex: '1', 
                textAlign: 'right',
                fontSize: '10px'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '5px',
                  color: '#2d3748'
                }}>
                  {devis.client.nom_complet}
                </div>
                <div style={{ color: '#4a5568' }}>
                  {devis.client.email}
                </div>
                <div style={{ color: '#4a5568' }}>
                  {devis.client.telephone}
                </div>
                <div style={{ color: '#4a5568' }}>
                  {(devis.client as any).adresse_complete || 'Adresse non renseignée'}
                </div>
              </div>
            </div>

            {/* Titre de l'événement */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '25px',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: '#1a202c'
            }}>
              {devis.titre || 'Prestation de services'}
            </div>

            {/* Tableau des lignes */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              marginBottom: '20px',
              fontSize: '9px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#edf2f7' }}>
                  <th style={{ 
                    border: '1px solid #cbd5e0', 
                    padding: '8px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Désignation
                  </th>
                  {/* <th style={{ 
                    border: '1px solid #cbd5e0', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Type
                  </th> */}
                  <th style={{ 
                    border: '1px solid #cbd5e0', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Qté
                  </th>
                  <th style={{ 
                    border: '1px solid #cbd5e0', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Unité
                  </th>
                  <th style={{ 
                    border: '1px solid #cbd5e0', 
                    padding: '8px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Prix unitaire
                  </th>
                  <th style={{ 
                    border: '1px solid #cbd5e0', 
                    padding: '8px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Séparer les prestations et les frais
                  const prestations = devis.lignes.filter((ligne: any) => ligne.type_ligne === 'prestation');
                  const frais = devis.lignes.filter((ligne: any) => ligne.type_ligne === 'frais');

                  const rows: JSX.Element[] = [];

                  // Grouper les prestations par service
                  if (prestations.length > 0) {
                    const groupedPrestations = prestations.reduce((acc: any, ligne: any) => {
                      const serviceName = ligne.service?.intitule || 'Service non défini';
                      if (!acc[serviceName]) {
                        acc[serviceName] = [];
                      }
                      acc[serviceName].push(ligne);
                      return acc;
                    }, {});

                    Object.entries(groupedPrestations).forEach(([serviceName, lines]: [string, any]) => {
                      // En-tête de section pour les prestations
                       rows.push(
                         <tr key={`header-prestation-${serviceName}`} style={{ backgroundColor: '#f7fafc' }}>
                           <td 
                             colSpan={6} 
                             style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               fontWeight: 'bold',
                               textAlign: 'center',
                               fontSize: '9px',
                               color: '#4a5568'
                             }}
                           >
                             {serviceName} - Prestations
                           </td>
                         </tr>
                       );
                       // Lignes de prestations
                       lines.forEach((ligne: any) => {
                         rows.push(
                           <tr key={ligne.id}>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'left'
                             }}>
                               <div style={{ fontWeight: '500' }}>
                                 {ligne.activity?.intitule || 'Activité non définie'}
                               </div>
                               {ligne.description && (
                                 <div style={{ 
                                   fontSize: '8px', 
                                   color: '#718096',
                                   marginTop: '2px'
                                 }}>
                                   {ligne.description}
                                 </div>
                               )}
                             </td>
                             {/* <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'center',
                               fontSize: '8px',
                               color: '#4a5568'
                             }}>
                               Prestation
                             </td> */}
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'center'
                             }}>
                               {ligne.quantite}
                             </td>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'center',
                               fontSize: '9px'
                             }}>
                               {ligne.unite?.code || '-'}
                             </td>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'right'
                             }}>
                               {formatMontant(ligne.prix_unitaire_ht)}
                             </td>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'right',
                               fontWeight: 'bold'
                             }}>
                               {formatMontant(ligne.montant_ht)}
                             </td>
                           </tr>
                         );
                       });
                    });
                  }

                  // Grouper les frais par catégorie
                  if (frais.length > 0) {
                    const groupedFrais = frais.reduce((acc: any, ligne: any) => {
                      const categoryName = ligne.frais_category?.name || 'Catégorie non définie';
                      if (!acc[categoryName]) {
                        acc[categoryName] = [];
                      }
                      acc[categoryName].push(ligne);
                      return acc;
                    }, {});

                    Object.entries(groupedFrais).forEach(([categoryName, lines]: [string, any]) => {
                                             // En-tête de section pour les frais
                       rows.push(
                         <tr key={`header-frais-${categoryName}`} style={{ backgroundColor: '#fef3c7' }}>
                           <td 
                             colSpan={6} 
                             style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               fontWeight: 'bold',
                               textAlign: 'center',
                               fontSize: '9px',
                               color: '#92400e'
                             }}
                           >
                             {categoryName} - Frais
                           </td>
                         </tr>
                       );

                                             // Lignes de frais
                       lines.forEach((ligne: any) => {
                         const typeFraisLabel = ligne.type_frais === 'forfait' ? 'Forfait' : 
                                               ligne.type_frais === 'offert' ? 'Offert' : 'Standard';
                         
                         rows.push(
                           <tr key={ligne.id}>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'left'
                             }}>
                               <div style={{ fontWeight: '500' }}>
                                 {ligne.ligne_frais?.description || 'Frais non défini'}
                               </div>
                               {ligne.description && (
                                 <div style={{ 
                                   fontSize: '8px', 
                                   color: '#718096',
                                   marginTop: '2px'
                                 }}>
                                   {ligne.description}
                                 </div>
                               )}
                             </td>
                             {/* <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'center',
                               fontSize: '8px',
                               color: '#92400e'
                             }}>
                               {typeFraisLabel}
                             </td> */}
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'center'
                             }}>
                               {ligne.quantite}
                             </td>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'center',
                               fontSize: '9px'
                             }}>
                               {ligne.unite?.code || '-'}
                             </td>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'right'
                             }}>
                               {formatMontant(ligne.prix_unitaire_ht)}
                             </td>
                             <td style={{ 
                               border: '1px solid #cbd5e0', 
                               padding: '6px 8px',
                               textAlign: 'right',
                               fontWeight: 'bold'
                             }}>
                               {formatMontant(ligne.montant_ht)}
                             </td>
                           </tr>
                         );
                       });
                    });
                  }

                  return rows;
                })()}
              </tbody>
            </table>

            {/* Totaux */}
            <div style={{ 
              textAlign: 'right',
              marginTop: '20px',
              borderTop: '2px solid #e2e8f0',
              paddingTop: '15px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '5px',
                fontSize: '11px'
              }}>
                <span style={{ fontWeight: 'bold', marginRight: '25px' }}>Montant HT:</span>
                <span style={{ fontWeight: 'bold' }}>{formatMontant(devis.montant_ht)}</span>
              </div>
              {devis.appliquer_tva && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '11px',
                  color: '#718096'
                }}>
                  <span style={{ fontWeight: 'bold', marginRight: '25px' }}>TVA ({devis.taux_tva}%):</span>
                  <span style={{ fontWeight: 'bold' }}>{formatMontant(devis.montant_tva)}</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '14px',
                color: '#2563eb',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '8px',
                marginTop: '8px',
                fontWeight: 'bold'
              }}>
                <span style={{ fontWeight: 'bold', marginRight: '25px' }}>Montant TTC:</span>
                <span style={{ fontWeight: 'bold' }}>{formatMontant(devis.montant_ttc)}</span>
              </div>
            </div>

            {/* Notes et conditions */}
            {(devis.notes || devis.conditions) && (
              <div style={{ 
                marginTop: '25px',
                pageBreakInside: 'avoid'
              }}>
                {devis.notes && (
                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ 
                      color: '#1e40af',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Notes
                    </h3>
                    <div style={{ 
                      backgroundColor: '#f7fafc',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '10px',
                      lineHeight: '1.4',
                      color: '#4a5568',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {devis.notes}
                    </div>
                  </div>
                )}
                {devis.conditions && (
                  <div>
                    <h3 style={{ 
                      color: '#1e40af',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Conditions générales
                    </h3>
                    <div style={{ 
                      backgroundColor: '#f7fafc',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '10px',
                      lineHeight: '1.4',
                      color: '#4a5568',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {devis.conditions}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pied de page */}
            <div style={{ 
              marginTop: '30px',
              textAlign: 'center',
              fontSize: '9px',
              color: '#718096',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '15px'
            }}>
              <p style={{ margin: '3px 0' }}>
                Ce devis est valable jusqu'au {formatDate(devis.date_validite)}
              </p>
              <p style={{ margin: '3px 0' }}>
                Pour toute question ou modification, n'hésitez pas à nous contacter
              </p>
              <p style={{ 
                fontWeight: 'bold', 
                color: '#4a5568', 
                fontSize: '10px',
                margin: '3px 0'
              }}>
                SAKOM - Votre partenaire de confiance
              </p>
              <p style={{ margin: '3px 0' }}>
                Email: contact@sakom.com | Téléphone: +224 XXX XXX XXX
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'envoi d'email */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Envoyer le devis par email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Destinataire *</Label>
              <Input
                type="email"
                value={emailForm.email_destinataire}
                onChange={(e) => setEmailForm({ ...emailForm, email_destinataire: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Sujet *</Label>
              <Input
                value={emailForm.sujet}
                onChange={(e) => setEmailForm({ ...emailForm, sujet: e.target.value })}
                placeholder="Sujet de l'email"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Message personnalisé</Label>
              <Textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                placeholder="Message optionnel à ajouter à l'email..."
                rows={4}
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Le devis sera automatiquement généré en PDF et joint à l'email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEmailDialogOpen(false)}
              disabled={envoyerEmailPDFMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={!emailForm.email_destinataire || !emailForm.sujet || envoyerEmailPDFMutation.isPending}
            >
              {envoyerEmailPDFMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16}/>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail size={16} className="mr-2" />
                  Envoyer l'email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 