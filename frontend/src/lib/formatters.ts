/**
 * Fonctions de formatage pour l'application SAKOM
 */

/**
 * Formate une date en format français
 * @param dateString - Date au format string
 * @returns Date formatée en français (ex: 25/12/2023)
 */
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

/**
 * Formate un montant en euros français
 * @param montant - Montant à formater (number ou string)
 * @returns Montant formaté en euros français (ex: 1 234,56 €)
 */
export const formatMontant = (montant: number | string) => {
  const num = typeof montant === 'string' ? parseFloat(montant) : montant;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
    .format(num || 0)
    .replace('GNF', '') // On retire le code devise pour le remplacer par le suffixe
    .trim() + ' GNF';
};

/**
 * Formate un temps en heures avec format français
 * @param temps - Temps à formater (number ou string)
 * @returns Temps formaté en français (ex: 8,5 h)
 */
export const formatTemps = (temps: number | string) => {
  const num = typeof temps === 'string' ? parseFloat(temps) : temps;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(num || 0);
};

/**
 * Formate un montant pour l'export PDF (alias de formatMontant)
 * @param montant - Montant à formater
 * @returns Montant formaté pour PDF
 */
export const formatMontantPDF = formatMontant;

/**
 * Formate un pourcentage en français
 * @param pourcentage - Pourcentage à formater (number ou string)
 * @returns Pourcentage formaté (ex: 20,5 %)
 */
export const formatPourcentage = (pourcentage: number | string) => {
  const num = typeof pourcentage === 'string' ? parseFloat(pourcentage) : pourcentage;
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format((num || 0) / 100);
};

/**
 * Formate un nombre avec séparateurs de milliers français
 * @param nombre - Nombre à formater
 * @returns Nombre formaté (ex: 1 234,56)
 */
export const formatNombre = (nombre: number | string) => {
  const num = typeof nombre === 'string' ? parseFloat(nombre) : nombre;
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num || 0);
}; 