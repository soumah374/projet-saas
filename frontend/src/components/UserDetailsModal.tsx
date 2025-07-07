import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  MapPin,
  Activity,
  Clock,
  Edit,
  Shield,
  Users,
  FolderOpen,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import type { UserList } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserList;
}

export const UserDetailsModal = ({ open, onOpenChange, user }: UserDetailsModalProps) => {
  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'Managing Director': 'bg-purple-100 text-purple-800',
      'Chef de projet': 'bg-blue-100 text-blue-800',
      'Designer': 'bg-pink-100 text-pink-800',
      'Développeur': 'bg-green-100 text-green-800',
      'Rédacteur': 'bg-yellow-100 text-yellow-800',
      'Consultant': 'bg-indigo-100 text-indigo-800',
      'Assistant': 'bg-gray-100 text-gray-800',
      'Finance/Admin': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Actif
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactif
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Détails de l'utilisateur
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur l'utilisateur et son activité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.profile.avatar} />
                  <AvatarFallback className="text-xl font-semibold">
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                  <p className="text-gray-600 text-lg">@{user.username}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {user.profile.role && getRoleBadge(user.profile.role)}
                    {getStatusBadge(user.is_active)}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {user.project_count} projet{parseInt(user.project_count) > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>

              {user.profile.bio && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 italic">"{user.profile.bio}"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Informations de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {user.profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">{user.profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Informations professionnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.profile.role && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rôle</p>
                      <p className="font-medium">{user.profile.role}</p>
                    </div>
                  </div>
                )}

                {user.profile.department && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Département</p>
                      <p className="font-medium">{user.profile.department}</p>
                    </div>
                  </div>
                )}

                {user.profile.position && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Poste</p>
                      <p className="font-medium">{user.profile.position}</p>
                    </div>
                  </div>
                )}

                {user.profile.hire_date && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date d'embauche</p>
                      <p className="font-medium">
                        {format(new Date(user.profile.hire_date), 'PPP', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity & Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activité et statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{user.project_count}</div>
                  <div className="text-sm text-gray-600">Projets assignés</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </div>
                  <div className="text-sm text-gray-600">Statut du compte</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.floor((new Date().getTime() - new Date(user.profile.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Jours dans l'équipe</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Informations système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Compte créé le:</span>
                  <p className="font-medium">
                    {format(new Date(user.profile.created_at), 'PPpp', { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Dernière mise à jour:</span>
                  <p className="font-medium">
                    {format(new Date(user.profile.updated_at), 'PPpp', { locale: fr })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">ID utilisateur:</span>
                  <p className="font-medium font-mono">#{user.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Nom d'utilisateur:</span>
                  <p className="font-medium">@{user.username}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer un email
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier le profil
                </Button>
                <Button variant="outline" size="sm">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Voir les projets
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Profil complet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 