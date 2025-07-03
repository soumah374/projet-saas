import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  Loader2, 
  AlertTriangle,
  User,
  FolderOpen,
  Shield
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { UserList } from '@/lib/types';

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserList;
  onSuccess: () => void;
}

export const DeleteUserModal = ({ open, onOpenChange, user, onSuccess }: DeleteUserModalProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: () => usersAPI.deleteUser(user.id),
    onSuccess: () => {
      toast.success('Utilisateur supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
      setConfirmationText('');
      setIsConfirmed(false);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
      console.error('Error deleting user:', error);
    }
  });

  const handleConfirmationChange = (value: string) => {
    setConfirmationText(value);
    setIsConfirmed(value === user.username);
  };

  const handleDelete = () => {
    if (!isConfirmed) {
      toast.error('Veuillez confirmer la suppression');
      return;
    }
    deleteUserMutation.mutate();
  };

  const handleCancel = () => {
    setConfirmationText('');
    setIsConfirmed(false);
    onOpenChange(false);
  };

  const hasProjects = parseInt(user.project_count) > 0;
  const isActiveUser = user.is_active;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Supprimer l'utilisateur
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Toutes les données de l'utilisateur seront définitivement supprimées.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card className="border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.profile.avatar} />
                  <AvatarFallback>
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.profile.role && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.profile.role}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <FolderOpen className="w-3 h-3 mr-1" />
                      {user.project_count} projet{parseInt(user.project_count) > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          <div className="space-y-3">
            {hasProjects && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Attention:</strong> Cet utilisateur est assigné à {user.project_count} projet{parseInt(user.project_count) > 1 ? 's' : ''}. 
                  La suppression pourrait affecter ces projets.
                </AlertDescription>
              </Alert>
            )}

                         {isActiveUser && (
               <Alert className="border-red-200 bg-red-50">
                 <AlertTriangle className="h-4 w-4 text-red-600" />
                 <AlertDescription className="text-red-800">
                   <strong>Utilisateur actif:</strong> Ce compte est actuellement actif. 
                   Considérez désactiver le compte plutôt que de le supprimer.
                 </AlertDescription>
               </Alert>
             )}

            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Action irréversible:</strong> Une fois supprimé, l'utilisateur et toutes ses données 
                (profil, historique, associations aux projets) seront définitivement perdues.
              </AlertDescription>
            </Alert>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Pour confirmer, tapez le nom d'utilisateur: <code className="bg-gray-100 px-1 rounded">{user.username}</code>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => handleConfirmationChange(e.target.value)}
              placeholder={`Tapez "${user.username}" pour confirmer`}
              className={isConfirmed ? 'border-green-300 bg-green-50' : 'border-red-300'}
            />
            {isConfirmed && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                ✓ Confirmation valide
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={deleteUserMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 