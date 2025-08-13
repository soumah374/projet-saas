import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

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

export function statusFacture(statut: string) {
  switch (statut) {
    case 'payee':
      return 'Payée';
    case 'en_attente':
      return 'En attente';
    case 'en_retard':
      return 'En retard';
    case 'annulee':
      return 'Annulée';
    case 'emise':
      return 'Emise';
    case 'envoyee':
      return 'Envoyée';
    case 'partiellement_payee':
      return 'Partiellement payée';
    default:
      return statut;
  }
}