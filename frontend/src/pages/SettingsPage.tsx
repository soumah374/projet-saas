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
  EyeOff
} from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  department: string;
  bio: string;
  location: string;
  timezone: string;
  language: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  project_updates: boolean;
  team_messages: boolean;
  deadline_reminders: boolean;
  weekly_reports: boolean;
}

interface SecuritySettings {
  two_factor_auth: boolean;
  session_timeout: number;
  password_expiry_days: number;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Simuler le chargement des données
    const mockProfile: UserProfile = {
      id: 1,
      username: "admin",
      first_name: "Marie",
      last_name: "Dupont",
      email: "marie.dupont@sakom.com",
      phone: "+33 1 23 45 67 89",
      role: "Chef de projet",
      department: "Développement",
      bio: "Chef de projet expérimentée avec plus de 8 ans d'expérience dans la gestion de projets web et mobiles.",
      location: "Paris, France",
      timezone: "Europe/Paris",
      language: "Français"
    };

    const mockNotifications: NotificationSettings = {
      email_notifications: true,
      push_notifications: true,
      project_updates: true,
      team_messages: true,
      deadline_reminders: true,
      weekly_reports: false
    };

    const mockSecurity: SecuritySettings = {
      two_factor_auth: false,
      session_timeout: 30,
      password_expiry_days: 90
    };

    setProfile(mockProfile);
    setNotifications(mockNotifications);
    setSecurity(mockSecurity);
    setIsLoading(false);
  }, []);

  const handleSaveProfile = () => {
    // Simuler la sauvegarde
    console.log('Sauvegarde du profil:', profile);
  };

  const handleSaveNotifications = () => {
    // Simuler la sauvegarde
    console.log('Sauvegarde des notifications:', notifications);
  };

  const handleSaveSecurity = () => {
    // Simuler la sauvegarde
    console.log('Sauvegarde de la sécurité:', security);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    // Simuler le changement de mot de passe
    console.log('Changement de mot de passe');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="text-lg">
                    {profile?.first_name[0]}{profile?.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Changer la photo
                  </Button>
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
                    value={profile?.first_name || ''}
                    onChange={(e) => setProfile(profile ? {...profile, first_name: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={profile?.last_name || ''}
                    onChange={(e) => setProfile(profile ? {...profile, last_name: e.target.value} : null)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  onChange={(e) => setProfile(profile ? {...profile, email: e.target.value} : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profile?.phone || ''}
                  onChange={(e) => setProfile(profile ? {...profile, phone: e.target.value} : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile?.bio || ''}
                  onChange={(e) => setProfile(profile ? {...profile, bio: e.target.value} : null)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    value={profile?.location || ''}
                    onChange={(e) => setProfile(profile ? {...profile, location: e.target.value} : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select value={profile?.timezone} onValueChange={(value) => setProfile(profile ? {...profile, timezone: value} : null)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder les modifications
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Préférences de notifications</CardTitle>
            <CardDescription>
              Configurez comment vous souhaitez recevoir vos notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications par email</h4>
                  <p className="text-sm text-gray-500">Recevoir les notifications par email</p>
                </div>
                <Switch
                  checked={notifications?.email_notifications}
                  onCheckedChange={(checked) => setNotifications(notifications ? {...notifications, email_notifications: checked} : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications push</h4>
                  <p className="text-sm text-gray-500">Recevoir les notifications push dans le navigateur</p>
                </div>
                <Switch
                  checked={notifications?.push_notifications}
                  onCheckedChange={(checked) => setNotifications(notifications ? {...notifications, push_notifications: checked} : null)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Mises à jour de projet</h4>
                  <p className="text-sm text-gray-500">Notifications sur les changements de statut des projets</p>
                </div>
                <Switch
                  checked={notifications?.project_updates}
                  onCheckedChange={(checked) => setNotifications(notifications ? {...notifications, project_updates: checked} : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Messages d'équipe</h4>
                  <p className="text-sm text-gray-500">Notifications sur les nouveaux messages d'équipe</p>
                </div>
                <Switch
                  checked={notifications?.team_messages}
                  onCheckedChange={(checked) => setNotifications(notifications ? {...notifications, team_messages: checked} : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Rappels d'échéance</h4>
                  <p className="text-sm text-gray-500">Rappels pour les tâches en approche d'échéance</p>
                </div>
                <Switch
                  checked={notifications?.deadline_reminders}
                  onCheckedChange={(checked) => setNotifications(notifications ? {...notifications, deadline_reminders: checked} : null)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Rapports hebdomadaires</h4>
                  <p className="text-sm text-gray-500">Recevoir un résumé hebdomadaire de l'activité</p>
                </div>
                <Switch
                  checked={notifications?.weekly_reports}
                  onCheckedChange={(checked) => setNotifications(notifications ? {...notifications, weekly_reports: checked} : null)}
                />
              </div>
            </div>

            <Button onClick={handleSaveNotifications}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder les préférences
            </Button>
          </CardContent>
        </Card>
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

              <Button onClick={handleChangePassword}>
                <Key className="w-4 h-4 mr-2" />
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
        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>
              Personnalisez l'apparence de votre interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={profile?.language} onValueChange={(value) => setProfile(profile ? {...profile, language: value} : null)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Français">Français</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Español">Español</SelectItem>
                  <SelectItem value="Deutsch">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thème</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-blue-500 rounded-lg p-4 text-center cursor-pointer">
                  <div className="w-8 h-8 bg-blue-500 rounded mx-auto mb-2"></div>
                  <span className="text-sm font-medium">Clair</span>
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-4 text-center cursor-pointer">
                  <div className="w-8 h-8 bg-gray-800 rounded mx-auto mb-2"></div>
                  <span className="text-sm font-medium">Sombre</span>
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-4 text-center cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded mx-auto mb-2"></div>
                  <span className="text-sm font-medium">Auto</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveProfile}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder les préférences
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 