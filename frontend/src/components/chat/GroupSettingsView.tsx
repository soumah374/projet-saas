import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Settings, Users, Crown, Shield, ShieldOff, ArrowLeft } from 'lucide-react';
import {
  ConversationMember,
  useUpdateGroupSettings,
  usePromoteGroupMember,
} from '../../hooks/use-chat';

interface GroupSettingsViewProps {
  onBack: () => void;
  conversationId: string;
  groupName?: string;
  groupDescription?: string;
  members: ConversationMember[];
  isAdmin: boolean;
  currentUserId: string;
  onSettingsUpdated?: () => void;
}

export function GroupSettingsView({
  onBack,
  conversationId,
  groupName = '',
  groupDescription = '',
  members,
  isAdmin,
  currentUserId,
  onSettingsUpdated,
}: GroupSettingsViewProps) {
  const [name, setName] = useState(groupName);
  const [description, setDescription] = useState(groupDescription || '');
  const [memberToPromote, setMemberToPromote] = useState<ConversationMember | null>(null);
  const [memberToDemote, setMemberToDemote] = useState<ConversationMember | null>(null);

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
      onBack();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handlePromoteMember = async () => {
    if (!memberToPromote) return;

    try {
      await promoteMemberMutation.mutateAsync({
        conversationId,
        userId: memberToPromote.user.id,
        role: 'admin',
      });
      onSettingsUpdated?.();
      setMemberToPromote(null);
    } catch (error) {
      console.error('Error promoting member:', error);
    }
  };

  const handleDemoteMember = async () => {
    if (!memberToDemote) return;

    try {
      await promoteMemberMutation.mutateAsync({
        conversationId,
        userId: memberToDemote.user.id,
        role: 'member',
      });
      onSettingsUpdated?.();
      setMemberToDemote(null);
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

  return (
    <div className="absolute inset-0 bg-background z-20 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Paramètres du groupe
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="members">
                <Users className="h-4 w-4 mr-1" />
                Membres ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 py-4">
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
            </TabsContent>

            <TabsContent value="members" className="py-4">
              <div className="space-y-2">
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
                              onClick={() => setMemberToPromote(member)}
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
                              onClick={() => setMemberToDemote(member)}
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
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Fermer
        </Button>
        {isAdmin && (
          <Button
            onClick={handleSaveSettings}
            disabled={!name.trim() || !hasSettingsChanged || updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        )}
      </div>

      {/* Promote confirmation dialog - Note: Nested AlertDialogs work fine physically, but visually we might want to check overlap. They are portal'ed usually. */}
      <AlertDialog open={!!memberToPromote} onOpenChange={() => setMemberToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promouvoir administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous promouvoir <strong>{memberToPromote?.user.fullName}</strong> en tant
              qu'administrateur ? Cette personne pourra gérer les membres et les paramètres du
              groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteMember}>
              {promoteMemberMutation.isPending ? 'Promotion...' : 'Promouvoir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote confirmation dialog */}
      <AlertDialog open={!!memberToDemote} onOpenChange={() => setMemberToDemote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer les droits d'administrateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous retirer les droits d'administrateur de{' '}
              <strong>{memberToDemote?.user.fullName}</strong> ? Cette personne ne pourra plus
              gérer les membres ni les paramètres du groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDemoteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {promoteMemberMutation.isPending ? 'Rétrogradation...' : 'Rétrograder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
