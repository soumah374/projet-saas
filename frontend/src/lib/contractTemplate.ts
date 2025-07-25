export const CONTRACT_TEMPLATE = `### **CONTRAT DE PRESTATION DE SERVICES**

**Entre les soussignés :**

**[RAISON_SOCIALE_PRESTATAIRE]**,
Société [FORME_JURIDIQUE] au capital de [MONTANT_CAPITAL] GNF,
immatriculée au RCS de [VILLE] sous le numéro [SIRET],
dont le siège social est situé à [ADRESSE_PRESTATAIRE],
représentée par [NOM_REPRESENTANT], en sa qualité de [FONCTION],
ci-après dénommée "le Prestataire",

**Et :**

**[NOM_CLIENT]**,
[STATUT_CLIENT] domicilié(e) à [ADRESSE_CLIENT],
immatriculé(e) sous le numéro [IDENTIFICATION_CLIENT],
représenté(e) par [NOM_REPRESENTANT_CLIENT], en sa qualité de [FONCTION_CLIENT],
ci-après dénommé "le Client",

**Il a été convenu ce qui suit :**

---

**Article 1 – Objet du contrat**

Le présent contrat a pour objet la réalisation des prestations définies dans le **devis n° [NUM_DEVIS]** daté du [DATE_DEVIS], annexé au présent contrat et accepté par le Client.

---

**Article 2 – Durée**

Le présent contrat prend effet à compter de sa date de signature pour une durée estimée de [DUREE_ESTIMEE] à compter du début des travaux fixé au [DATE_DEBUT_PRESTATION].

---

**Article 3 – Description des prestations**

Le Prestataire s'engage à réaliser les prestations suivantes :
**[DESCRIPTION_PRESTATION]**
Conformément au devis annexé.

---

**Article 4 – Modalités d'exécution**

Le Prestataire exécutera les prestations selon les règles de l'art et s'engage à respecter les délais convenus. Le Client s'engage à fournir toutes les informations et moyens nécessaires à la bonne exécution de la mission.

---

**Article 5 – Prix et modalités de paiement**

Le montant total de la prestation est fixé à **[MONTANT_TTC] GNF**, selon le devis accepté.
Modalités de paiement :

* [MODALITES_PAIEMENT]
* Paiement par virement bancaire aux coordonnées indiquées sur la facture.

---

**Article 6 – Confidentialité**

Les parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre du présent contrat.

---

**Article 7 – Propriété intellectuelle**

Sauf stipulation contraire dans le devis, les livrables réalisés restent la propriété du Prestataire jusqu'au paiement intégral. Une fois le paiement effectué, le Client devient propriétaire des livrables, à l'exception des éléments tiers sous licence.

---

**Article 8 – Résiliation**

En cas de manquement grave de l'une des parties à ses obligations contractuelles, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet pendant [DELAI_RESILIATION] jours.

---

**Article 9 – Litiges**

En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera porté devant le tribunal compétent du ressort du siège social du Prestataire.

---

Fait à [VILLE_SIGNATURE], le [DATE_SIGNATURE],
En deux exemplaires originaux.

**Le Prestataire**                          | **Le Client**
(signature)                                 | (signature)`;

export interface ContractVariables {
  // Informations prestataire
  RAISON_SOCIALE_PRESTATAIRE: string;
  FORME_JURIDIQUE: string;
  MONTANT_CAPITAL: string;
  VILLE: string;
  SIRET: string;
  ADRESSE_PRESTATAIRE: string;
  NOM_REPRESENTANT: string;
  FONCTION: string;
  
  // Informations client
  NOM_CLIENT: string;
  STATUT_CLIENT: string;
  ADRESSE_CLIENT: string;
  IDENTIFICATION_CLIENT: string;
  NOM_REPRESENTANT_CLIENT: string;
  FONCTION_CLIENT: string;
  
  // Informations contrat
  NUM_DEVIS: string;
  DATE_DEVIS: string;
  DUREE_ESTIMEE: string;
  DATE_DEBUT_PRESTATION: string;
  DESCRIPTION_PRESTATION: string;
  MONTANT_TTC: string;
  MODALITES_PAIEMENT: string;
  DELAI_RESILIATION: string;
  VILLE_SIGNATURE: string;
  DATE_SIGNATURE: string;
}

export const DEFAULT_CONTRACT_VARIABLES: ContractVariables = {
  // Informations prestataire
  RAISON_SOCIALE_PRESTATAIRE: 'SAKOM SARL',
  FORME_JURIDIQUE: 'SARL',
  MONTANT_CAPITAL: '10 000',
  VILLE: 'Conakry',
  SIRET: '12345678901234',
  ADRESSE_PRESTATAIRE: '123 Avenue de la République, Conakry, Guinée',
  NOM_REPRESENTANT: 'Mamadou Diallo',
  FONCTION: 'Directeur Général',
  
  // Informations client
  NOM_CLIENT: '[NOM_CLIENT]',
  STATUT_CLIENT: 'Société',
  ADRESSE_CLIENT: '[ADRESSE_CLIENT]',
  IDENTIFICATION_CLIENT: '[IDENTIFICATION_CLIENT]',
  NOM_REPRESENTANT_CLIENT: '[NOM_REPRESENTANT_CLIENT]',
  FONCTION_CLIENT: '[FONCTION_CLIENT]',
  
  // Informations contrat
  NUM_DEVIS: '[NUM_DEVIS]',
  DATE_DEVIS: '[DATE_DEVIS]',
  DUREE_ESTIMEE: '[DUREE_ESTIMEE]',
  DATE_DEBUT_PRESTATION: '[DATE_DEBUT_PRESTATION]',
  DESCRIPTION_PRESTATION: '[DESCRIPTION_PRESTATION]',
  MONTANT_TTC: '[MONTANT_TTC]',
  MODALITES_PAIEMENT: '30% à la commande, solde à la livraison',
  DELAI_RESILIATION: '30',
  VILLE_SIGNATURE: 'Conakry',
  DATE_SIGNATURE: '[DATE_SIGNATURE]',
};

export function replaceContractVariables(template: string, variables: ContractVariables): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

export function extractContractVariables(contrat: any): ContractVariables {
  const dateDebut = new Date(contrat.date_debut);
  const dateFin = new Date(contrat.date_fin);
  const dureeEnJours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    // Informations prestataire (par défaut)
    RAISON_SOCIALE_PRESTATAIRE: 'SAKOM SARL',
    FORME_JURIDIQUE: 'SARL',
    MONTANT_CAPITAL: '10 000',
    VILLE: 'Conakry',
    SIRET: '12345678901234',
    ADRESSE_PRESTATAIRE: '123 Avenue de la République, Conakry, Guinée',
    NOM_REPRESENTANT: 'Mamadou Diallo',
    FONCTION: 'Directeur Général',
    
    // Informations client
    NOM_CLIENT: contrat.client.nom_complet,
    STATUT_CLIENT: contrat.client.raison_sociale ? 'Société' : 'Particulier',
    ADRESSE_CLIENT: contrat.client.adresse_complete || '[ADRESSE_CLIENT]',
    IDENTIFICATION_CLIENT: contrat.client.raison_sociale || '[IDENTIFICATION_CLIENT]',
    NOM_REPRESENTANT_CLIENT: contrat.client.nom_complet,
    FONCTION_CLIENT: '[FONCTION_CLIENT]',
    
    // Informations contrat
    NUM_DEVIS: contrat.devis.numero,
    DATE_DEVIS: new Date(contrat.devis.date_creation).toLocaleDateString('fr-FR'),
    DUREE_ESTIMEE: `${dureeEnJours} jours`,
    DATE_DEBUT_PRESTATION: new Date(contrat.date_debut).toLocaleDateString('fr-FR'),
    DESCRIPTION_PRESTATION: contrat.lignes.map((ligne: any) => 
      `${ligne.description || ligne.intitule} - ${ligne.quantite} ${ligne.unite.intitule}`
    ).join(', '),
    MONTANT_TTC: contrat.montant_ttc.toString(),
    MODALITES_PAIEMENT: '30% à la commande, solde à la livraison',
    DELAI_RESILIATION: '30',
    VILLE_SIGNATURE: 'Conakry',
    DATE_SIGNATURE: new Date().toLocaleDateString('fr-FR'),
  };
} 