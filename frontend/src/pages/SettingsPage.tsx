import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Key,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useCurrentUser, useUpdateProfile, useChangePassword, useUploadAvatar } from '@/hooks/use-profile';
import { useAppearance, getLanguageLabel, getThemeLabel, Theme, Language } from '@/contexts/AppearanceContext';
import { useAppearancePreferences } from '@/hooks/use-appearance-settings';
import { useNotificationPreferences } from '@/hooks/use-notification-settings';
import { toast } from 'sonner';

// Les interfaces sont maintenant dans les hooks respectifs

interface SecuritySettings {
  two_factor_auth: boolean;
  session_timeout: number;
  password_expiry_days: number;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hooks pour les API
  const { data: profile, isLoading, error } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const uploadAvatarMutation = useUploadAvatar();
  
  // Hooks pour l'apparence
  const { settings: appearanceContext, updateTheme, updateLanguage } = useAppearance();
  const { settings: appearanceSettings, updateSettings: updateAppearanceSettings, isUpdating } = useAppearancePreferences();
  
  // Hooks pour les notifications
  const { 
    settings: notificationSettings, 
    updateSetting: updateNotificationSetting,
    enableAll: enableAllNotifications,
    disableAll: disableAllNotifications,
    enableEssentialOnly: enableEssentialNotifications,
    isUpdating: isUpdatingNotifications
  } = useNotificationPreferences();

  // États locaux pour les formulaires
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile: {
      phone: '',
      bio: '',
      department: '',
      position: ''
    }
  });

  // Initialiser le formulaire quand les données du profil sont chargées
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        profile: {
          phone: profile.profile?.phone || '',
          bio: profile.profile?.bio || '',
          department: profile.profile?.department || '',
          position: profile.profile?.position || ''
        }
      });
    }

    // Données mockées pour la sécurité (à implémenter plus tard)
    const mockSecurity: SecuritySettings = {
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry_days: 90
    };

    setSecurity(mockSecurity);
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  // Les notifications sont maintenant gérées automatiquement par les hooks

  const handleSaveSecurity = () => {
    // TODO: Implémenter la sauvegarde des paramètres de sécurité
    toast.success('Paramètres de sécurité sauvegardés (fonctionnalité à implémenter)');
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    changePasswordMutation.mutate({
      old_password: currentPassword,
      new_password: newPassword,
      new_password_confirm: confirmPassword
    }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifications côté client
      const maxSize = 2 * 1024 * 1024; // 2MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      
      if (file.size > maxSize) {
        toast.error('Le fichier est trop volumineux. Taille maximum : 2MB');
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Type de fichier non autorisé. Formats acceptés : JPG, PNG, GIF');
        return;
      }
      
      uploadAvatarMutation.mutate(file);
    }
    
    // Réinitialiser l'input file pour permettre le même fichier
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement du profil</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600">
          Gérez vos préférences et votre compte
        </p>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Photo de profil */}
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Ajoutez une photo pour personnaliser votre profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.profile?.avatar} />
                  <AvatarFallback className="text-lg">
                    {profile?.first_name?.[0] || 'U'}{profile?.last_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadAvatarMutation.isPending}
                    >
                      {uploadAvatarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 mr-2" />
                      )}
                      Changer la photo
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    JPG, PNG ou GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profileForm.profile.phone}
                  onChange={(e) => setProfileForm({
                    ...profileForm, 
                    profile: {...profileForm.profile, phone: e.target.value}
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileForm.profile.bio}
                  onChange={(e) => setProfileForm({
                    ...profileForm, 
                    profile: {...profileForm.profile, bio: e.target.value}
                  })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Input
                    id="department"
                    value={profileForm.profile.department}
                    onChange={(e) => setProfileForm({
                      ...profileForm, 
                      profile: {...profileForm.profile, department: e.target.value}
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Input
                    id="position"
                    value={profileForm.profile.position}
                    onChange={(e) => setProfileForm({
                      ...profileForm, 
                      profile: {...profileForm.profile, position: e.target.value}
                    })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Sauvegarder les modifications
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Configurez rapidement vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  onClick={enableAllNotifications}
                  disabled={isUpdatingNotifications}
                >
                  {isUpdatingNotifications ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Tout activer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={disableAllNotifications}
                  disabled={isUpdatingNotifications}
                >
                  {isUpdatingNotifications ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Tout désactiver
                </Button>
                <Button 
                  variant="outline" 
                  onClick={enableEssentialNotifications}
                  disabled={isUpdatingNotifications}
                >
                  {isUpdatingNotifications ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2" />
                  )}
                  Essentielles uniquement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications générales */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications générales</CardTitle>
              <CardDescription>
                Configurez les canaux de notification principaux
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications par email</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Recevoir les notifications par email</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.email_notifications ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('email_notifications', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications push</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Recevoir les notifications push dans le navigateur</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.push_notifications ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('push_notifications', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications de projet */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications de projet</CardTitle>
              <CardDescription>
                Notifications liées aux projets et aux tâches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Mises à jour de projet</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notifications sur les changements de statut des projets</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.project_updates ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('project_updates', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Attribution de tâches</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notifications lors de l'attribution de nouvelles tâches</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.task_assignments ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('task_assignments', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rappels d'échéance</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rappels pour les activités en approche d'échéance</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.deadline_reminders ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('deadline_reminders', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications sociales */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications sociales</CardTitle>
              <CardDescription>
                Interactions avec l'équipe et collaborations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Messages d'équipe</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notifications sur les nouveaux messages d'équipe</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.team_messages ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('team_messages', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Mentions dans les commentaires</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notifications quand vous êtes mentionné dans un commentaire</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.comment_mentions ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('comment_mentions', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Partage de documents</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notifications quand un document est partagé avec vous</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.document_sharing ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('document_sharing', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications financières et rapports */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications financières et rapports</CardTitle>
              <CardDescription>
                Factures, paiements et rapports périodiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rappels de factures</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rappels pour les factures en attente de paiement</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.invoice_reminders ?? true}
                    onCheckedChange={(checked) => updateNotificationSetting('invoice_reminders', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rapports hebdomadaires</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Recevoir un résumé hebdomadaire de l'activité</p>
                  </div>
                  <Switch
                    checked={notificationSettings?.weekly_reports ?? false}
                    onCheckedChange={(checked) => updateNotificationSetting('weekly_reports', checked)}
                    disabled={isUpdatingNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé des paramètres */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de vos préférences</CardTitle>
              <CardDescription>
                Aperçu de vos paramètres de notifications actuels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600 dark:text-green-400">Notifications activées</h4>
                  <div className="space-y-1">
                    {notificationSettings?.email_notifications && <Badge variant="outline">Email</Badge>}
                    {notificationSettings?.push_notifications && <Badge variant="outline">Push</Badge>}
                    {notificationSettings?.project_updates && <Badge variant="outline">Projets</Badge>}
                    {notificationSettings?.task_assignments && <Badge variant="outline">Tâches</Badge>}
                    {notificationSettings?.deadline_reminders && <Badge variant="outline">Échéances</Badge>}
                    {notificationSettings?.team_messages && <Badge variant="outline">Messages</Badge>}
                    {notificationSettings?.comment_mentions && <Badge variant="outline">Mentions</Badge>}
                    {notificationSettings?.document_sharing && <Badge variant="outline">Documents</Badge>}
                    {notificationSettings?.invoice_reminders && <Badge variant="outline">Factures</Badge>}
                    {notificationSettings?.weekly_reports && <Badge variant="outline">Rapports</Badge>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-600 dark:text-gray-400">Statistiques</h4>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>
                      {Object.values(notificationSettings || {}).filter(Boolean).length} notifications activées sur {Object.keys(notificationSettings || {}).length}
                    </p>
                    <p className="mt-1">
                      Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Changement de mot de passe */}
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>

          {/* Paramètres de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Configurez les options de sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Authentification à deux facteurs</h4>
                  <p className="text-sm text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
                </div>
                <Switch
                  checked={security?.two_factor_auth}
                  onCheckedChange={(checked) => setSecurity(security ? {...security, two_factor_auth: checked} : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_timeout">Délai d'expiration de session (minutes)</Label>
                <Select value={security?.session_timeout.toString()} onValueChange={(value) => setSecurity(security ? {...security, session_timeout: parseInt(value)} : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_expiry">Expiration du mot de passe (jours)</Label>
                <Select value={security?.password_expiry_days.toString()} onValueChange={(value) => setSecurity(security ? {...security, password_expiry_days: parseInt(value)} : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="60">60 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="180">180 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveSecurity}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Sélection du thème */}
          <Card>
            <CardHeader>
              <CardTitle>Thème d'affichage</CardTitle>
              <CardDescription>
                Choisissez l'apparence de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
                  <div
                    key={theme}
                    onClick={() => {
                      updateTheme(theme);
                      updateAppearanceSettings({ theme });
                    }}
                    className={`
                      relative border-2 rounded-lg p-4 text-center cursor-pointer transition-all hover:shadow-md
                      ${appearanceContext.theme === theme 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded mx-auto mb-2 
                      ${theme === 'light' ? 'bg-white border border-gray-300' : ''}
                      ${theme === 'dark' ? 'bg-gray-800' : ''}
                      ${theme === 'system' ? 'bg-gradient-to-r from-white to-gray-800 border border-gray-300' : ''}
                    `}></div>
                    <span className="text-sm font-medium">{getThemeLabel(theme)}</span>
                    {appearanceContext.theme === theme && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Système :</strong> Suit automatiquement les préférences de votre système d'exploitation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sélection de la langue */}
          <Card>
            <CardHeader>
              <CardTitle>Langue et région</CardTitle>
              <CardDescription>
                Configurez la langue de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Langue de l'interface</Label>
                <Select 
                  value={appearanceContext.language} 
                  onValueChange={(value: Language) => {
                    updateLanguage(value);
                    updateAppearanceSettings({ language: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['fr', 'en', 'es', 'de'] as Language[]).map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {getLanguageLabel(lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select defaultValue="Europe/Paris">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                    <SelectItem value="Africa/Casablanca">Africa/Casablanca (GMT+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_format">Format de date</Label>
                  <Select defaultValue="DD/MM/YYYY">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_format">Format d'heure</Label>
                  <Select defaultValue="24h">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 heures (14:30)</SelectItem>
                      <SelectItem value="12h">12 heures (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prévisualisation */}
          <Card>
            <CardHeader>
              <CardTitle>Prévisualisation</CardTitle>
              <CardDescription>
                Aperçu de l'interface avec vos paramètres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Exemple de carte
                  </h3>
                  <Badge variant="secondary">
                    {getThemeLabel(appearanceContext.theme)}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Ceci est un aperçu de l'interface avec le thème {getThemeLabel(appearanceContext.theme).toLowerCase()} 
                  et la langue {getLanguageLabel(appearanceContext.language)}.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Globe className="w-4 h-4" />
                  <span>Langue : {getLanguageLabel(appearanceContext.language)}</span>
                  <span>•</span>
                  <span>Thème : {getThemeLabel(appearanceContext.theme)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 