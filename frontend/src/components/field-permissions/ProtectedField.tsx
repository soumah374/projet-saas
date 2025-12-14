import React from 'react';
import { useFieldAccess } from '@/hooks/use-field-permissions';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface ProtectedFieldProps {
  modelName: string;
  appLabel: string;
  fieldName: string;
  objectId?: number;
  children: React.ReactNode;
  mode?: 'hide' | 'disable' | 'show-locked';
  fallback?: React.ReactNode;
  requireWrite?: boolean; // Si true, vérifie la permission write au lieu de read
}

/**
 * Composant qui protège l'affichage/édition d'un champ selon les permissions.
 *
 * Modes:
 * - 'hide': Cache complètement le champ si pas de permission
 * - 'disable': Affiche le champ mais le désactive si pas de permission write
 * - 'show-locked': Affiche le champ avec une icône de cadenas si pas de permission
 *
 * @example
 * <ProtectedField
 *   modelName="contrat"
 *   appLabel="contrats"
 *   fieldName="montant_ttc"
 *   mode="disable"
 * >
 *   <Input name="montant_ttc" />
 * </ProtectedField>
 */
export const ProtectedField: React.FC<ProtectedFieldProps> = ({
  modelName,
  appLabel,
  fieldName,
  objectId,
  children,
  mode = 'hide',
  fallback = null,
  requireWrite = false,
}) => {
  const { canRead, canWrite, isLoading } = useFieldAccess(
    modelName,
    appLabel,
    fieldName,
    objectId
  );

  // Pendant le chargement, on peut afficher un skeleton ou rien
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-10 rounded" />;
  }

  // Déterminer si l'utilisateur a la permission requise
  const hasPermission = requireWrite ? canWrite : canRead;

  // Mode 'hide': cache le champ si pas de permission
  if (mode === 'hide') {
    if (!hasPermission) {
      return fallback ? <>{fallback}</> : null;
    }
    return <>{children}</>;
  }

  // Mode 'disable': désactive le champ si pas de permission write
  if (mode === 'disable') {
    if (!canRead) {
      return fallback ? <>{fallback}</> : null;
    }

    // Clone l'enfant et ajoute la prop disabled si pas de permission write
    if (!canWrite && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        disabled: true,
        readOnly: true,
      });
    }

    return <>{children}</>;
  }

  // Mode 'show-locked': affiche avec une icône si pas de permission
  if (mode === 'show-locked') {
    if (!canRead) {
      return (
        <div className="relative">
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded border border-gray-300">
            <Lock size={16} className="text-gray-500" />
            <span className="text-sm text-gray-500">Champ protégé</span>
          </div>
        </div>
      );
    }

    if (!canWrite) {
      return (
        <div className="relative">
          {React.isValidElement(children) &&
            React.cloneElement(children as React.ReactElement<any>, {
              disabled: true,
              readOnly: true,
            })}
          <div className="absolute top-2 right-2">
            <Lock size={16} className="text-gray-500" />
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }

  return <>{children}</>;
};

interface ProtectedSectionProps {
  modelName: string;
  appLabel: string;
  fields: string[];
  objectId?: number;
  children: React.ReactNode;
  mode?: 'hide' | 'disable';
  fallback?: React.ReactNode;
  requireAllFields?: boolean; // Si true, il faut avoir accès à tous les champs
}

/**
 * Composant qui protège une section entière basée sur les permissions de plusieurs champs.
 *
 * @example
 * <ProtectedSection
 *   modelName="contrat"
 *   appLabel="contrats"
 *   fields={['montant_ht', 'montant_tva', 'montant_ttc']}
 *   requireAllFields={false}
 * >
 *   <div>Section financière</div>
 * </ProtectedSection>
 */
export const ProtectedSection: React.FC<ProtectedSectionProps> = ({
  modelName,
  appLabel,
  fields,
  objectId,
  children,
  mode = 'hide',
  fallback = null,
  requireAllFields = false,
}) => {
  const { data: permissions, isLoading } = useModelFieldPermissions(
    modelName,
    appLabel,
    objectId
  );

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded" />;
  }

  // Vérifier si l'utilisateur a accès à au moins un champ (ou tous selon requireAllFields)
  const hasAccess = requireAllFields
    ? fields.every(field => permissions?.fields?.[field]?.read)
    : fields.some(field => permissions?.fields?.[field]?.read);

  if (!hasAccess && mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Import nécessaire pour ProtectedSection
import { useModelFieldPermissions } from '@/hooks/use-field-permissions';

interface FieldPermissionIndicatorProps {
  canRead: boolean;
  canWrite: boolean;
  className?: string;
}

/**
 * Petit indicateur visuel pour montrer les permissions d'un champ
 */
export const FieldPermissionIndicator: React.FC<FieldPermissionIndicatorProps> = ({
  canRead,
  canWrite,
  className = '',
}) => {
  if (!canRead) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs text-red-600 ${className}`}>
        <EyeOff size={12} />
        <span>Aucun accès</span>
      </div>
    );
  }

  if (!canWrite) {
    return (
      <div className={`inline-flex items-center gap-1 text-xs text-yellow-600 ${className}`}>
        <Eye size={12} />
        <span>Lecture seule</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 text-xs text-green-600 ${className}`}>
      <Eye size={12} />
      <span>Lecture/Écriture</span>
    </div>
  );
};
