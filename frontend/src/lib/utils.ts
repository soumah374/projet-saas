import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function safeParseDate(date?: string | Date | null): Date | null {
  if (!date) return null;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null;
}

export function statutContrat(statut: string) {
  switch (statut) {
    case 'actif':
      return 'Actif';
    case 'suspendu':
      return 'Suspendu';
    case 'signe':
      return 'Signé';
    case 'cloture':
      return 'Clôturé';
    case 'annule':
      return 'Annulé';
    case 'envoye':
      return 'Envoyé';
    case 'brouillon':
      return 'Brouillon';
    case 'archive':
      return 'Archivé';
    case 'termine':
      return 'Terminé';
    default:
      return statut;
  }
}