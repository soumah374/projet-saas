import { UserPermissionsInfo } from '../components/UserPermissionsInfo';
import { usePermissions } from '../hooks/use-permissions';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Shield, User, Settings, Activity } from 'lucide-react';

export const UserPermissionsPage = () => {
  const { getUserRole, getUserModules, getUserPermissions, isLoading } = usePermissions();

  const userRole = getUserRole();
  const userModules = getUserModules();
  const userPermissions = getUserPermissions();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Permissions</h1>
          <p className="text-gray-600 mt-2">
            Consultez vos permissions et accès dans l'application
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="text-sm text-gray-500">Permissions dynamiques</span>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôle</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole ? (
                <Badge variant="default" className="text-sm">
                  {userRole}
                </Badge>
              ) : (
                <span className="text-gray-500">Non défini</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules accessibles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userModules.length}</div>
            <p className="text-xs text-muted-foreground">
              modules avec accès
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPermissions.length}</div>
            <p className="text-xs text-muted-foreground">
              permissions accordées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détails des permissions */}
      <UserPermissionsInfo />

      {/* Modules accessibles */}
      {userModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Modules accessibles ({userModules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {userModules.map((module) => (
                <Badge key={module} variant="outline" className="justify-center">
                  {module}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions détaillées */}
      {userPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions détaillées ({userPermissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {userPermissions.map((permission) => (
                  <div key={permission} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-mono">{permission}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* État de chargement */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement des permissions...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 