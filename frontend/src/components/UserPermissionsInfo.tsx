import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Shield, User, Settings, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface UserPermissions {
  user_id: number;
  user_name: string;
  user_role: string;
  groups: string[];
  permissions: string[];
  is_staff: boolean;
  is_superuser: boolean;
  module_permissions: {
    [key: string]: {
      view: boolean;
      add: boolean;
      change: boolean;
      delete: boolean;
    };
  };
}

export const UserPermissionsInfo = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get('/users/permissions_summary/');
        setPermissions(response.data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des permissions:', err);
        setError(err.response?.data?.message || 'Erreur lors de la récupération des permissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Chargement des permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erreur: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!permissions) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nom</p>
              <p className="text-sm">{permissions.user_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Rôle</p>
              <Badge variant={permissions.is_staff ? "default" : "secondary"}>
                {permissions.user_role || 'Non défini'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Statut</p>
              <Badge variant={permissions.is_staff ? "default" : "outline"}>
                {permissions.is_staff ? 'Staff' : 'Utilisateur'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Groupes et permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Groupes</p>
              <div className="flex flex-wrap gap-2">
                {permissions.groups.length > 0 ? (
                  permissions.groups.map((group) => (
                    <Badge key={group} variant="outline">
                      {group}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Aucun groupe</span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Permissions totales</p>
              <p className="text-sm">{permissions.permissions.length} permissions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissions par module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(permissions.module_permissions).map(([module, perms]) => (
              <div key={module} className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 capitalize">{module}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {perms.view ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>Voir</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {perms.add ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>Créer</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {perms.change ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>Modifier</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {perms.delete ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>Supprimer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions détaillées ({permissions.permissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {permissions.permissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-mono">{permission}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 