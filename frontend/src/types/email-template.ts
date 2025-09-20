export interface EmailTemplate {
  id: number;
  nom: string;
  type_email: string;
  type_email_display: string;
  sujet: string;
  contenu: string;
  est_actif: boolean;
  est_defaut: boolean;
  date_creation: string;
  date_modification: string;
}

export interface EmailTemplateVariable {
  id: number;
  type_email: string;
  type_email_display: string;
  nom_variable: string;
  description: string;
  exemple: string;
}

export interface EmailTemplateCreate {
  nom: string;
  type_email: string;
  sujet: string;
  contenu: string;
  est_actif: boolean;
  est_defaut: boolean;
}

export interface EmailTemplatePreview {
  subject: string;
  content: string;
  context_used: Record<string, string>;
}

export const EMAIL_TYPES = [
  { value: 'devis', label: 'Devis' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'avenant', label: 'Avenant' },
  { value: 'facture', label: 'Facture' },
  { value: 'relance', label: 'Relance de paiement' },
  { value: 'rappel', label: 'Rappel général' },
] as const;

export type EmailType = typeof EMAIL_TYPES[number]['value'];
