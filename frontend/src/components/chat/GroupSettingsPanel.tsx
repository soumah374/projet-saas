import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Settings, Users, Crown, Shield, ShieldOff, ArrowLeft } from 'lucide-react';
import {
  ConversationMember,
  useUpdateGroupSettings,
  usePromoteGroupMember,
} from '../../hooks/use-chat';

interface GroupSettingsPanelProps {
  conversationId: string;
  groupName?: string;
  groupDescription?: string;
  members: ConversationMember[];
  isAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
  onSettingsUpdated?: () => void;
}

export function GroupSettingsPanel({
  conversationId,
  groupName = '',
  groupDescription = '',
  members,
  isAdmin,
  currentUserId,
  onClose,
  onSettingsUpdated,
}: GroupSettingsPanelProps) {
  const [name, setName] = useState(groupName);
  const [description, setDescription] = useState(groupDescription || '');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote' | 'demote';
    member: ConversationMember;
  } | null>(null);

  const updateSettingsMutation = useUpdateGroupSettings();
  const promoteMemberMutation = usePromoteGroupMember();

  useEffect(() => {
    setName(groupName);
    setDescription(groupDescription || '');
  }, [groupName, groupDescription]);

  const handleSaveSettings = async () => {
    if (!name.trim()) return;

    try {
      await updateSettingsMutation.mutateAsync({
        conversationId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onSettingsUpdated?.();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handlePromoteMember = async (member: ConversationMember) => {
    try {
      await promoteMemberMutation.mutateAsync({
        conversationId,
        userId: member.user.id,
        role: 'admin',
      });
      onSettingsUpdated?.();
      setConfirmAction(null);
    } catch (error) {
      console.error('Error promoting member:', error);
    }
  };

  const handleDemoteMember = async (member: ConversationMember) => {
    try {
      await promoteMemberMutation.mutateAsync({
        conversationId,
        userId: member.user.id,
        role: 'member',
      });
      onSettingsUpdated?.();
      setConfirmAction(null);
    } catch (error) {
      console.error('Error demoting member:', error);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.user.fullName.localeCompare(b.user.fullName);
  });

  const adminCount = members.filter((m) => m.role === 'admin').length;
  const hasSettingsChanged = name !== groupName || description !== (groupDescription || '');

  // Confirmation inline view
  if (confirmAction) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setConfirmAction(null)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">
            {confirmAction.type === 'promote' ? 'Promouvoir administrateur' : 'Retirer les droits admin'}
          </h3>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Avatar className="h-16 w-16 mb-4">
            <AvatarFallback className="text-lg">
              {confirmAction.member.user.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-medium mb-2">{confirmAction.member.user.fullName}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {confirmAction.type === 'promote'
              ? 'Cette personne pourra gérer les membres et les paramètres du groupe.'
              : 'Cette personne ne pourra plus gérer les membres ni les paramètres du groupe.'}
          </p>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmAction(null)}>
            Annuler
          </Button>
          <Button
            variant={confirmAction.type === 'demote' ? 'destructive' : 'default'}
            onClick={() =>
              confirmAction.type === 'promote'
                ? handlePromoteMember(confirmAction.member)
                : handleDemoteMember(confirmAction.member)
            }
            disabled={promoteMemberMutation.isPending}
          >
            {promoteMemberMutation.isPending
              ? 'En cours...'
              : confirmAction.type === 'promote'
              ? 'Promouvoir'
              : 'Rétrograder'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h3 className="font-semibold">Paramètres du groupe</h3>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="general" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 px-4 mt-2">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-1" />
            Membres ({members.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex-1 p-4 space-y-4 mt-0">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nom du groupe *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du groupe"
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du groupe (optionnel)"
              rows={3}
              disabled={!isAdmin}
            />
          </div>

          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Seuls les administrateurs peuvent modifier les paramètres du groupe.
            </p>
          )}

          {isAdmin && hasSettingsChanged && (
            <Button
              onClick={handleSaveSettings}
              disabled={!name.trim() || updateSettingsMutation.isPending}
              className="w-full"
            >
              {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="members" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {sortedMembers.map((member) => {
                const isCurrentUser = String(member.user.id) === String(currentUserId);
                const isMemberAdmin = member.role === 'admin';
                const canDemote = isMemberAdmin && adminCount > 1 && !isCurrentUser;
                const canPromote = !isMemberAdmin && isAdmin;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {member.user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {member.user.fullName}
                          {isCurrentUser && (
                            <span className="text-muted-foreground"> (vous)</span>
                          )}
                        </p>
                      </div>
                      {isMemberAdmin && (
                        <Badge
                          variant="secondary"
                          className="text-xs h-5 px-1.5 bg-amber-100 text-amber-800 mt-1"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>

                    {isAdmin && !isCurrentUser && (
                      <div className="flex gap-1">
                        {canPromote && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'promote', member })}
                            className="h-8 text-xs"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Promouvoir
                          </Button>
                        )}
                        {canDemote && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'demote', member })}
                            className="h-8 text-xs text-muted-foreground"
                          >
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Rétrograder
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
