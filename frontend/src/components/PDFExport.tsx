import React, { useRef, useState } from 'react';
import { formatDate, formatMontant, formatTemps } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useEnvoyerEmailPDF, useGenererPDF } from '@/hooks/use-devis';
import { devisAPI } from '@/lib/api';

interface PDFExportProps {
  devis: any;
  onClose: () => void;
}

export const PDFExport: React.FC<PDFExportProps> = ({ devis, onClose }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email_destinataire: devis?.client?.email || '',
    sujet: `Devis ${devis?.numero} - ${devis?.client?.nom_complet}`,
    message: '',
    use_custom_template: true
  });

  const envoyerEmailPDFMutation = useEnvoyerEmailPDF();
  const genererPDFMutation = useGenererPDF();

  const handleDownload = async () => {
    try {
      setIsGeneratingPDF(true);
      const response = await devisAPI.genererPDF(devis.id);
      
      // Créer un blob à partir de la réponse (maintenant configurée avec responseType: 'blob')
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis-${devis.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      toast.error('Erreur lors du téléchargement du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      await envoyerEmailPDFMutation.mutateAsync({
        id: devis.id,
        data: {
          email_destinataire: emailForm.email_destinataire,
          sujet: emailForm.sujet,
          message: emailForm.message,
          use_custom_template: emailForm.use_custom_template
        }
      });

      setEmailDialogOpen(false);
      setEmailForm({
        email_destinataire: devis?.client?.email || '',
        sujet: `Devis ${devis?.numero} - ${devis?.client?.nom_complet}`,
        message: '',
        use_custom_template: true
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
              onClick={handleDownload}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Génération...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Télécharger PDF
                </>
              )}
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
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ 
                    border: '1px solid #2d3748', 
                    padding: '8px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Désignation
                  </th>
                  <th style={{ 
                    border: '1px solid #2d3748', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Qté
                  </th>
                  <th style={{ 
                    border: '1px solid #2d3748', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Unité
                  </th>
                  <th style={{ 
                    border: '1px solid #2d3748', 
                    padding: '8px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Prix unitaire
                  </th>
                  <th style={{ 
                    border: '1px solid #2d3748', 
                    padding: '8px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Montant
                  </th>
                  <th style={{ 
                    border: '1px solid #2d3748', 
                    padding: '8px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Séparer les prestations et les frais
                  const prestations = devis.lignes.filter((ligne: any) => ligne.type_ligne === 'prestation');
                  const frais = devis.lignes.filter((ligne: any) => ligne.type_ligne === 'frais');

                  const rows: JSX.Element[] = [];

                  // Section PRESTATIONS
                  if (prestations.length > 0) {
                    // En-tête de section PRESTATION
                    rows.push(
                      <tr key="header-prestations" style={{ backgroundColor: '#f5f5f5' }}>
                        <td 
                          colSpan={6} 
                          style={{ 
                            border: '1px solid #2d3748', 
                            padding: '10px 8px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontSize: '11px',
                            color: '#000',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}
                        >
                          PRESTATION
                        </td>
                      </tr>
                    );

                    // Lignes de prestations
                    prestations.forEach((ligne: any) => {
                      rows.push(
                        <tr key={ligne.id} style={{ backgroundColor: '#fff' }}>
                          <td style={{ 
                            border: '1px solid #2d3748', 
                            padding: '8px',
                            textAlign: 'left'
                          }}>
                            <div style={{ fontWeight: '500', fontSize: '10px' }}>
                              {ligne.activity?.name || ligne.activity?.intitule || 'Activité non définie'}
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
                          <td style={{ 
                            border: '1px solid #2d3748', 
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '10px'
                          }}>
                            {ligne.quantite}
                          </td>
                          <td style={{ 
                            border: '1px solid #000', 
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '10px'
                          }}>
                            {ligne.unite?.code || 'EX'}
                          </td>
                          <td style={{ 
                            border: '1px solid #2d3748', 
                            padding: '8px',
                            textAlign: 'right',
                            fontSize: '10px'
                          }}>
                            {formatMontant(ligne.prix_unitaire_ht)}
                          </td>
                          <td style={{ 
                            border: '1px solid #2d3748', 
                            padding: '8px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '10px'
                          }}>
                            {formatMontant(ligne.montant_ht)}
                          </td>
                          <td  style={{ 
                            border: '1px solid #2d3748', 
                            padding: '8px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            color: 'red'
                          }}>
                            {ligne.statut || 'N/A'}
                          </td>
                        </tr>
                      );
                    });
                  }

                  // Section FRAIS
                  if (frais.length > 0) {
                    // En-tête de section FRAIS
                    rows.push(
                      <tr key="header-frais" style={{ backgroundColor: '#f5f5f5' }}>
                        <td 
                          colSpan={6} 
                          style={{ 
                            border: '1px solid #000',
                            padding: '10px 8px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontSize: '11px',
                            color: '#000',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}
                        >
                          FRAIS
                        </td>
                      </tr>
                    );

                    // Lignes de frais
                    frais.forEach((ligne: any) => {
                      const typeFraisLabel = ligne.type_frais === 'forfait' ? 'forfait' : 
                                            ligne.type_frais === 'offert' ? 'offert' : 'standard';
                      
                      rows.push(
                        <tr key={ligne.id} style={{ backgroundColor: '#fff' }}>
                          <td style={{ 
                            border: '1px solid #000', 
                            padding: '8px',
                            textAlign: 'left',
                          }}>
                            <div style={{ fontWeight: '500', fontSize: '10px' }}>
                              {ligne.ligne_frais?.description || 'Frais non défini'}
                            </div>
                            <div style={{ 
                              fontSize: '8px', 
                              color: '#000',
                              marginTop: '2px',
                              fontWeight: 'bold'
                            }}>
                              {typeFraisLabel}
                            </div>
                            {ligne.description && (
                              <div style={{ 
                                fontSize: '8px', 
                                color: '#666',
                                marginTop: '2px'
                              }}>
                                {ligne.description}
                              </div>
                            )}
                          </td>
                          <td style={{ 
                            border: '1px solid #000', 
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '10px'
                          }}>
                            {ligne.type_frais === 'forfait' ? 'Forfait' : ligne.quantite}
                          </td>
                          <td style={{ 
                            border: '1px solid #000', 
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: '10px'
                          }}>
                            {ligne.type_frais === 'forfait' ? 'Forfait' : (ligne.unite?.code || 'EX')}
                          </td>
                          <td style={{ 
                            border: '1px solid #000', 
                            padding: '8px',
                            textAlign: 'right',
                            fontSize: '10px'
                          }}>
                            {ligne.type_frais === 'forfait' ? 'Forfait' : formatMontant(ligne.prix_unitaire_ht)}
                          </td>
                          <td style={{ 
                            border: '1px solid #000', 
                            padding: '8px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '10px'
                          }}>
                            {formatMontant(ligne.montant_ht)}
                          </td>
                          <td style={{ 
                            border: '1px solid red', 
                            padding: '8px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            color: 'red'
                          }}>
                            {ligne.statut || 'N/A'}
                          </td>
                        </tr>
                      );
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
              {devis.appliquer_frais_agence && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '11px',
                  color: '#718096'
                }}>
                  <span style={{ fontWeight: 'bold', marginRight: '25px' }}>Frais d'agence ({devis.taux_frais_agence}%):</span>
                  <span style={{ fontWeight: 'bold' }}>{formatMontant(devis.montant_frais_agence || 0)}</span>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '14px',
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
              {devis.appliquer_frais_agence && (
                <p style={{ 
                  margin: '3px 0', 
                  fontSize: '8px', 
                  color: '#a0aec0',
                  fontStyle: 'italic'
                }}>
                  * Les frais d'agence incluent : Conseil, Accompagnement & Coordination générale de l'événement
                </p>
              )}
              <p style={{ margin: '3px 0' }}>
                Pour toute question ou modification, n'hésitez pas à nous contacter
              </p>
              <p style={{ 
                fontWeight: 'bold', 
                color: '#4a5568', 
                fontSize: '10px',
                margin: '3px 0'
              }}>
                saKom - Votre partenaire de confiance
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
                <strong>Note :</strong> Le devis sera automatiquement généré en PDF côté serveur et joint à l'email. 
                Le PDF utilisera le template professionnel avec formatage optimisé.
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