import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Génère un PDF à partir d'un élément DOM (par exemple, le rendu du devis) et retourne le base64 pur (sans préfixe).
 * @param elementId L'id de l'élément DOM à capturer (ex: 'devis-pdf-content')
 * @returns base64 string du PDF (sans préfixe)
 */
export async function generateDevisPDFfromElement(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.clientWidth,
      height: element.clientHeight,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
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
    // Retourne le base64 pur (sans préfixe)
    return pdf.output('datauristring').replace(/^data:application\/pdf;base64,/, '');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return null;
  }
}

/**
 * Génère un PDF minimal à partir des infos du devis (exemple fallback)
 */
export function generateMinimalDevisPDF(devis: any): string {
  const pdf = new jsPDF();
  pdf.text(`Devis n°${devis.numero}`, 10, 10);
  // ... ajoutez d'autres infos si besoin ...
  return pdf.output('datauristring').replace(/^data:application\/pdf;base64,/, '');
}

// Génération PDF pour les contrats
export async function generateContratPDFfromElement(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add subsequent pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('datauristring').replace(/^data:application\/pdf;base64,/, '');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF du contrat:', error);
    return null;
  }
}

export function generateMinimalContratPDF(contrat: any, contenu: string): string | null {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = 30;
    
    // En-tête
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONTRAT DE PRESTATION DE SERVICES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Informations du contrat
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contrat N°: ${contrat.numero}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Client: ${contrat.client?.nom || 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Date de début: ${contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Date de fin: ${contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : 'N/A'}`, margin, yPosition);
    yPosition += 15;
    
    // Contenu du contrat
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(contenu, contentWidth);
    
    for (const line of lines) {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    }
    
    // Pied de page
    yPosition += 20;
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(10);
    pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Montant TTC: ${contrat.montant_ttc?.toLocaleString('fr-FR')} GNF`, margin, yPosition);
    
    return pdf.output('datauristring').replace(/^data:application\/pdf;base64,/, '');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF minimal du contrat:', error);
    return null;
  }
}

export function generateContratPDFFromTemplate(contrat: any, template: any, variables: any): string | null {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = 30;
    
    // En-tête
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONTRAT DE PRESTATION DE SERVICES', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    // Informations du contrat
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Contrat N°: ${contrat.numero}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Client: ${contrat.client?.nom || 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Devis N°: ${contrat.devis?.numero || 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Date de début: ${contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : 'N/A'}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Date de fin: ${contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString('fr-FR') : 'N/A'}`, margin, yPosition);
    yPosition += 15;
    
    // Contenu du template avec variables remplacées
    let contenu = template.contenu;
    for (const [variable, valeur] of Object.entries(variables)) {
      contenu = contenu.replace(new RegExp(`\\[${variable}\\]`, 'g'), String(valeur));
    }
    
    // Ajouter les variables spécifiques au contrat
    contenu = contenu.replace(/\[NUM_DEVIS\]/g, contrat.devis?.numero || 'N/A');
    contenu = contenu.replace(/\[DATE_DEVIS\]/g, contrat.devis?.date_creation ? new Date(contrat.devis.date_creation).toLocaleDateString('fr-FR') : 'N/A');
    contenu = contenu.replace(/\[MONTANT_TTC\]/g, contrat.montant_ttc?.toLocaleString('fr-FR') || '0');
    contenu = contenu.replace(/\[NOM_CLIENT\]/g, contrat.client?.nom || 'N/A');
    contenu = contenu.replace(/\[ADRESSE_CLIENT\]/g, contrat.client?.adresse_complete || 'N/A');
    contenu = contenu.replace(/\[DATE_DEBUT_PRESTATION\]/g, contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString('fr-FR') : 'N/A');
    contenu = contenu.replace(/\[DATE_SIGNATURE\]/g, new Date().toLocaleDateString('fr-FR'));
    contenu = contenu.replace(/\[VILLE_SIGNATURE\]/g, 'Conakry');
    
    // Traitement du contenu avec formatage
    const sections = contenu.split('\n\n');
    
    for (const section of sections) {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Détecter les titres (commençant par ###)
      if (section.startsWith('###')) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const titre = section.replace('###', '').trim();
        pdf.text(titre, margin, yPosition);
        yPosition += 10;
      } else if (section.startsWith('####')) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const sousTitre = section.replace('####', '').trim();
        pdf.text(sousTitre, margin, yPosition);
        yPosition += 8;
      } else {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(section, contentWidth);
        
        for (const line of lines) {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        }
      }
      
      yPosition += 5;
    }
    
    // Pied de page
    yPosition += 20;
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(10);
    pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Template: ${template.nom}`, margin, yPosition);
    
    return pdf.output('datauristring').replace(/^data:application\/pdf;base64,/, '');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF du contrat depuis le template:', error);
    return null;
  }
} 