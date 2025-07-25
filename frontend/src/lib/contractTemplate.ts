export interface ContractTemplateData {
  // Informations prestataire
  raison_sociale_prestataire: string;
  forme_juridique: string;
  montant_capital: string;
  ville_rcs: string;
  siret: string;
  adresse_prestataire: string;
  nom_representant: string;
  fonction_representant: string;
  
  // Informations client
  nom_client: string;
  type_client: 'Société' | 'Particulier';
  adresse_client: string;
  numero_identification: string;
  nom_representant_client: string;
  fonction_representant_client: string;
  
  // Informations devis/contrat
  numero_devis: string;
  date_devis: string;
  duree_estimee: string;
  date_debut_prestation: string;
  description_prestation: string;
  montant_ttc: string;
  modalites_paiement: string;
  delai_resiliation: string;
  ville_signature: string;
  date_signature: string;
  
  // Conditions personnalisées
  conditions_specifiques?: string;
  notes_additionnelles?: string;
}

export const DEFAULT_CONTRACT_TEMPLATE = `### **CONTRAT DE PRESTATION DE SERVICES**

#### **Entre les soussignés :**

**{{raison_sociale_prestataire}}**,
Société {{forme_juridique}} au capital de {{montant_capital}} GNF,
immatriculée au RCS de {{ville_rcs}} sous le numéro {{siret}},
dont le siège social est situé à {{adresse_prestataire}},
représentée par {{nom_representant}}, en sa qualité de {{fonction_representant}},
ci-après dénommée "le Prestataire",

**Et :**

**{{nom_client}}**,
{{type_client}} domicilié(e) à {{adresse_client}},
immatriculé(e) sous le numéro {{numero_identification}},
représenté(e) par {{nom_representant_client}}, en sa qualité de {{fonction_representant_client}},
ci-après dénommé "le Client",

**Il a été convenu ce qui suit :**

---

### **Article 1 – Objet du contrat**

Le présent contrat a pour objet la réalisation des prestations définies dans le **devis n° {{numero_devis}}** daté du {{date_devis}}, annexé au présent contrat et accepté par le Client.

---

### **Article 2 – Durée**

Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de {{duree_estimee}} à compter du début des travaux fixé au {{date_debut_prestation}}.

---

### **Article 3 – Description des prestations**

Le Prestataire s'engage à réaliser les prestations suivantes :
**{{description_prestation}}**
Conformément au devis annexé.

---

### **Article 4 – Modalités d'exécution**

Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.

---

### **Article 5 – Prix et modalités de paiement**

Le montant total de la prestation est fixé à **{{montant_ttc}} GNF**, selon le devis accepté.
Modalités de paiement :

{{modalites_paiement}}

---

### **Article 6 – Confidentialité**

Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.

---

### **Article 7 – Propriété intellectuelle**

Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.

---

### **Article 8 – Résiliation**

En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant {{delai_resiliation}} jours.

---

### **Article 9 – Litiges**

En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.

{{#if conditions_specifiques}}
---

### **Article 10 – Conditions spécifiques**

{{conditions_specifiques}}
{{/if}}

{{#if notes_additionnelles}}
---

### **Notes additionnelles**

{{notes_additionnelles}}
{{/if}}

---

Fait à {{ville_signature}}, le {{date_signature}},
En deux exemplaires originaux.

**Le Prestataire**                          | **Le Client**
(signature)                                 | (signature)`;

export function generateContractFromTemplate(template: string, data: ContractTemplateData): string {
  let result = template;
  
  // Remplacer toutes les variables du template
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  // Gérer les conditions Handlebars-like
  if (data.conditions_specifiques) {
    result = result.replace(/{{#if conditions_specifiques}}([\s\S]*?){{\/if}}/g, '$1');
  } else {
    result = result.replace(/{{#if conditions_specifiques}}[\s\S]*?{{\/if}}/g, '');
  }
  
  if (data.notes_additionnelles) {
    result = result.replace(/{{#if notes_additionnelles}}([\s\S]*?){{\/if}}/g, '$1');
  } else {
    result = result.replace(/{{#if notes_additionnelles}}[\s\S]*?{{\/if}}/g, '');
  }
  
  return result;
}

export function generateDefaultContractData(contrat: any, devis: any): ContractTemplateData {
  const today = new Date();
  const dateDebut = new Date(contrat.date_debut);
  const dateFin = new Date(contrat.date_fin);
  const dureeEnJours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    // Informations prestataire (à configurer)
    raison_sociale_prestataire: 'SAKOM SARL',
    forme_juridique: 'SARL',
    montant_capital: '100 000 000',
    ville_rcs: 'Conakry',
    siret: 'GN12345678901234',
    adresse_prestataire: '123 Avenue de la République, Conakry, Guinée',
    nom_representant: 'Directeur Général',
    fonction_representant: 'Directeur Général',
    
    // Informations client
    nom_client: contrat.client.nom_complet,
    type_client: contrat.client.raison_sociale ? 'Société' : 'Particulier',
    adresse_client: contrat.client.adresse_complete || 'Non renseignée',
    numero_identification: contrat.client.numero_identification || 'Non renseigné',
    nom_representant_client: contrat.client.nom_complet,
    fonction_representant_client: 'Représentant',
    
    // Informations devis/contrat
    numero_devis: devis.numero,
    date_devis: new Date(devis.date_creation).toLocaleDateString('fr-FR'),
    duree_estimee: `${dureeEnJours} jours`,
    date_debut_prestation: new Date(contrat.date_debut).toLocaleDateString('fr-FR'),
    description_prestation: contrat.lignes.map((ligne: any) => 
      `- ${ligne.description || ligne.intitule} (${ligne.quantite} ${ligne.unite.intitule})`
    ).join('\n'),
    montant_ttc: contrat.montant_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 0 }),
    modalites_paiement: '• 30% à la commande\n• 70% à la livraison\n• Paiement par virement bancaire aux coordonnées indiquées sur la facture.',
    delai_resiliation: '30',
    ville_signature: 'Conakry',
    date_signature: today.toLocaleDateString('fr-FR'),
    
    // Conditions personnalisées
    conditions_specifiques: contrat.conditions || undefined,
    notes_additionnelles: contrat.notes || undefined,
  };
} 