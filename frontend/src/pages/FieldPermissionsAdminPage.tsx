import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldPermissionsManager } from '@/components/field-permissions/FieldPermissionsManager';
import { UserFieldPermissionsAssigner } from '@/components/field-permissions/UserFieldPermissionsAssigner';
import { Shield, UserPlus, List, Settings } from 'lucide-react';

/**
 * Page d'administration complète pour la gestion des permissions par champ.
 *
 * Onglets:
 * - Assigner: Interface pour assigner rapidement des permissions à des utilisateurs/groupes
 * - Gérer: Liste et gestion de toutes les permissions existantes
 */
export const FieldPermissionsAdminPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield size={32} className="text-blue-600" />
          Administration des Permissions par Champ
        </h1>
        <p className="text-gray-600">
          Gérez finement les permissions de lecture et d'écriture sur chaque champ de vos modèles
        </p>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="assign" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="assign" className="flex items-center gap-2">
            <UserPlus size={16} />
            Assigner des Permissions
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <List size={16} />
            Gérer les Permissions
          </TabsTrigger>
        </TabsList>

        {/* Onglet Assigner */}
        <TabsContent value="assign" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Settings size={18} />
              Comment ça marche ?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
              <li>Sélectionnez un utilisateur ou un groupe</li>
              <li>Choisissez le modèle (ex: Contrat, Devis, Facture...)</li>
              <li>Cochez les champs et le type de permission (Lecture/Écriture)</li>
              <li>Optionnellement, spécifiez un ID d'objet pour des permissions au niveau instance</li>
              <li>Cliquez sur "Assigner les Permissions"</li>
            </ul>
          </div>

          <UserFieldPermissionsAssigner />
        </TabsContent>

        {/* Onglet Gérer */}
        <TabsContent value="manage" className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <Settings size={18} />
              Gestion des permissions existantes
            </h3>
            <p className="text-sm text-amber-800">
              Consultez et supprimez les permissions existantes. Pour modifier une permission,
              supprimez-la et recréez-la avec les nouveaux paramètres.
            </p>
          </div>

          <FieldPermissionsManager />
        </TabsContent>
      </Tabs>

      {/* Aide rapide */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield size={16} className="text-blue-600" />
            Types de permissions
          </h4>
          <ul className="text-sm space-y-1 text-gray-600">
            <li><strong>Lecture:</strong> Peut voir le champ</li>
            <li><strong>Écriture:</strong> Peut modifier le champ (inclut la lecture)</li>
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <UserPlus size={16} className="text-green-600" />
            Niveaux d'application
          </h4>
          <ul className="text-sm space-y-1 text-gray-600">
            <li><strong>Utilisateur:</strong> Permission individuelle</li>
            <li><strong>Groupe:</strong> Pour tous les membres du groupe</li>
            <li><strong>Modèle:</strong> Sans ID objet = tous les objets</li>
            <li><strong>Instance:</strong> Avec ID objet = objet spécifique</li>
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Settings size={16} className="text-purple-600" />
            Bonnes pratiques
          </h4>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>Utilisez les groupes pour les permissions communes</li>
            <li>Permissions au niveau modèle pour la simplicité</li>
            <li>Permissions instance pour des cas spéciaux</li>
            <li>Les superusers ont toujours tous les accès</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FieldPermissionsAdminPage;
