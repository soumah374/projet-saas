import React from 'react';
import { formatDate, formatMontant, formatTemps } from '@/lib/formatters';

interface PDFExportProps {
  devis: any;
  onClose: () => void;
}

export const PDFExport: React.FC<PDFExportProps> = ({ devis, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Créer un blob avec le contenu HTML
    const htmlContent = document.getElementById('pdf-content')?.innerHTML;
    if (htmlContent) {
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Devis ${devis.numero}</title>
          <style>
            ${getPDFStyles()}
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `], { type: 'text/html' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devis-${devis.numero}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getPDFStyles = () => `
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      color: #1a202c;
      line-height: 1.5;
      font-size: 11px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 25px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
    }
    
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .header .devis-info {
      margin-top: 8px;
      font-size: 13px;
      color: #4a5568;
      font-weight: 500;
    }
    
    .header .devis-number {
      font-size: 16px;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 5px;
    }
    
    .company-info {
      float: left;
      width: 48%;
      margin-bottom: 20px;
    }
    
    .company-info h3 {
      color: #2563eb;
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: bold;
    }
    
    .company-info p {
      margin: 3px 0;
      font-size: 11px;
      color: #4a5568;
    }
    
    .client-info {
      float: right;
      width: 48%;
      text-align: right;
      margin-bottom: 20px;
    }
    
    .client-info h3 {
      color: #2563eb;
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: bold;
    }
    
    .client-info p {
      margin: 3px 0;
      font-size: 11px;
      color: #4a5568;
    }
    
    .client-info .client-name {
      font-weight: bold;
      color: #2d3748;
      font-size: 12px;
    }
    
    .clear {
      clear: both;
    }
    
    .devis-details {
      margin: 20px 0;
      padding: 12px;
      background-color: #f7fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    
    .devis-details h3 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 14px;
      font-weight: bold;
    }
    
    .devis-details .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .devis-details .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .devis-details .label {
      font-weight: bold;
      color: #4a5568;
      font-size: 10px;
    }
    
    .devis-details .value {
      color: #2d3748;
      font-size: 10px;
      font-weight: 500;
    }
    
    .section-title {
      color: #1e40af;
      font-size: 14px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }
    
    .lignes-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9px;
    }
    
    .lignes-table th,
    .lignes-table td {
      border: 1px solid #cbd5e0;
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }
    
    .lignes-table th {
      background-color: #edf2f7;
      font-weight: bold;
      color: #2d3748;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .lignes-table .text-right {
      text-align: right;
    }
    
    .lignes-table .text-center {
      text-align: center;
    }
    
    .lignes-table .description {
      max-width: 150px;
      word-wrap: break-word;
    }
    
    .intervenants-section {
      margin-top: 10px;
      padding: 8px;
      background-color: #f7fafc;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    
    .intervenants-section h4 {
      margin: 0 0 5px 0;
      font-size: 9px;
      color: #4a5568;
      font-weight: bold;
    }
    
    .intervenants-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }
    
    .intervenants-table th,
    .intervenants-table td {
      border: 1px solid #e2e8f0;
      padding: 2px 4px;
      text-align: left;
    }
    
    .intervenants-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #475569;
      font-size: 8px;
    }
    
    .intervenants-table .text-right {
      text-align: right;
    }
    
    .totals {
      margin-top: 20px;
      text-align: right;
      border-top: 2px solid #e2e8f0;
      padding-top: 15px;
    }
    
    .totals .total-item {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      padding: 3px 0;
      font-size: 11px;
    }
    
    .totals .total-label {
      font-weight: bold;
      margin-right: 25px;
      color: #4a5568;
    }
    
    .totals .total-value {
      font-weight: bold;
      color: #2d3748;
    }
    
    .totals .total-ht {
      font-size: 12px;
    }
    
    .totals .total-tva {
      font-size: 11px;
      color: #718096;
    }
    
    .totals .total-ttc {
      font-size: 14px;
      color: #2563eb;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 8px;
      font-weight: bold;
    }
    
    .notes-conditions {
      margin-top: 25px;
      page-break-inside: avoid;
    }
    
    .notes-conditions h3 {
      color: #1e40af;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: bold;
    }
    
    .notes-conditions .content {
      background-color: #f7fafc;
      padding: 10px;
      border-radius: 4px;
      white-space: pre-wrap;
      border: 1px solid #e2e8f0;
      font-size: 10px;
      line-height: 1.4;
      color: #4a5568;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 9px;
      color: #718096;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
    
    .footer p {
      margin: 3px 0;
    }
    
    .footer .company-name {
      font-weight: bold;
      color: #4a5568;
      font-size: 10px;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
      
      .print-actions {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  `;

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
              Télécharger HTML
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
          <div id="pdf-content" className="bg-white">
            {/* En-tête */}
            <div className="header">
              <h1>Devis</h1>
              <div className="devis-number">N° {devis.numero}</div>
              <div className="devis-info">
                Date de création: {formatDate(devis.date_creation)} | 
                Date de validité: {formatDate(devis.date_validite)} | 
                Statut: {devis.statut_display}
              </div>
            </div>

            {/* Informations entreprise et client */}
            <div className="company-info">
              <h3>SAKOM</h3>
              <p>Votre partenaire de confiance</p>
              <p>Email: contact@sakom.com</p>
              <p>Téléphone: +243 XXX XXX XXX</p>
              <p>Adresse: Kinshasa, République Démocratique du Congo</p>
              <p>Site web: www.sakom.com</p>
            </div>

            <div className="client-info">
              <h3>Client</h3>
              <p className="client-name">{devis.client.nom_complet}</p>
              <p>Email: {devis.client.email}</p>
              <p>Téléphone: {devis.client.telephone}</p>
              <p>Adresse: {(devis.client as any).adresse_complete || 'Non renseignée'}</p>
              <p>Type: {(devis.client as any).type_client_display || 'Non spécifié'}</p>
            </div>

            <div className="clear"></div>

            {/* Détails du devis */}
            <div className="devis-details">
              <h3>Informations du devis</h3>
              <div className="grid">
                <div className="item">
                  <span className="label">Numéro de devis:</span>
                  <span className="value">{devis.numero}</span>
                </div>
                <div className="item">
                  <span className="label">Statut:</span>
                  <span className="value">{devis.statut_display}</span>
                </div>
                <div className="item">
                  <span className="label">Date de création:</span>
                  <span className="value">{formatDate(devis.date_creation)}</span>
                </div>
                <div className="item">
                  <span className="label">Date de validité:</span>
                  <span className="value">{formatDate(devis.date_validite)}</span>
                </div>
                <div className="item">
                  <span className="label">Type de client:</span>
                  <span className="value">{(devis.client as any).type_client_display || 'Non spécifié'}</span>
                </div>
                <div className="item">
                  <span className="label">Nombre de lignes:</span>
                  <span className="value">{devis.lignes.length}</span>
                </div>
              </div>
            </div>

            {/* Lignes de devis */}
            <div className="section-title">Détail des prestations</div>
            <table className="lignes-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Activité</th>
                  <th>Description</th>
                  <th className="text-center">Quantité</th>
                  <th>Unité</th>
                  <th className="text-right">Prix unitaire HT</th>
                  <th className="text-right">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes.map((ligne: any, index: number) => (
                  <React.Fragment key={ligne.id}>
                    <tr>
                      <td><strong>{ligne.service.intitule}</strong></td>
                      <td>{ligne.activity.intitule}</td>
                      <td className="description">{ligne.description || '-'}</td>
                      <td className="text-center">{ligne.quantite}</td>
                      <td>{ligne.unite.intitule}</td>
                      <td className="text-right">{formatMontant(ligne.prix_unitaire_ht)}</td>
                      <td className="text-right"><strong>{formatMontant(ligne.montant_ht)}</strong></td>
                    </tr>
                    {/* Intervenants pour cette ligne */}
                    {ligne.intervenants && ligne.intervenants.length > 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '0', border: 'none' }}>
                          <div className="intervenants-section">
                            <h4>Intervenants pour cette ligne :</h4>
                            <table className="intervenants-table">
                              <thead>
                                <tr>
                                  <th>Profil</th>
                                  <th className="text-right">Temps</th>
                                  <th className="text-right">Taux horaire</th>
                                  <th className="text-right">Montant</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ligne.intervenants.map((intervenant: any) => (
                                  <tr key={intervenant.id}>
                                    <td>{intervenant.profile_intervenant.nom_complet}</td>
                                    <td className="text-right">{formatTemps(intervenant.temps_intervenant)}</td>
                                    <td className="text-right">{formatMontant(intervenant.taux_horaire)}</td>
                                    <td className="text-right">{formatMontant(intervenant.temps_intervenant * intervenant.taux_horaire)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Totaux */}
            <div className="totals">
              <div className="total-item total-ht">
                <span className="total-label">Montant HT:</span>
                <span className="total-value">{formatMontant(devis.montant_ht)}</span>
              </div>
              <div className="total-item total-tva">
                <span className="total-label">TVA (16%):</span>
                <span className="total-value">{formatMontant(devis.montant_tva)}</span>
              </div>
              <div className="total-item total-ttc">
                <span className="total-label">Montant TTC:</span>
                <span className="total-value">{formatMontant(devis.montant_ttc)}</span>
              </div>
            </div>

            {/* Notes et conditions */}
            {(devis.notes || devis.conditions) && (
              <div className="notes-conditions">
                {devis.notes && (
                  <>
                    <h3>Notes</h3>
                    <div className="content">{devis.notes}</div>
                  </>
                )}
                {devis.conditions && (
                  <>
                    <h3>Conditions générales</h3>
                    <div className="content">{devis.conditions}</div>
                  </>
                )}
              </div>
            )}

            {/* Pied de page */}
            <div className="footer">
              <p>Ce devis est valable jusqu'au {formatDate(devis.date_validite)}</p>
              <p>Pour toute question ou modification, n'hésitez pas à nous contacter</p>
              <p className="company-name">SAKOM - Votre partenaire de confiance</p>
              <p>Email: contact@sakom.com | Téléphone: +243 XXX XXX XXX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 