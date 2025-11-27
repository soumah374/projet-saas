import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Trash2, 
  Save, 
  Settings, 
  Image as ImageIcon,
  Palette,
  Building,
  Info,
  AlertCircle
} from 'lucide-react';
import { useAppConfig, useUpdateAppConfig, useUploadLogo, useUploadFavicon, useDeleteLogo, useDeleteFavicon } from '@/hooks/use-app-config';
import { ApplicationConfig } from '@/services/appConfigService';
import { toast } from '@/hooks/use-toast';

export function AppConfigPage() {
  const { data: config, isLoading, error } = useAppConfig();
  const updateConfig = useUpdateAppConfig();
  const uploadLogo = useUploadLogo();
  const uploadFavicon = useUploadFavicon();
  const deleteLogo = useDeleteLogo();
  const deleteFavicon = useDeleteFavicon();

  const [formData, setFormData] = useState<Partial<ApplicationConfig>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Initialiser le formulaire avec les données de configuration
  useEffect(() => {
    if (config) {
      setFormData({
        app_name: config.app_name,
        app_description: config.app_description,
        company_name: config.company_name,
        company_address: config.company_address,
        company_phone: config.company_phone,
        company_email: config.company_email,
        company_website: config.company_website,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color,
      });
    }
  }, [config]);

  const handleInputChange = (field: keyof ApplicationConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide.",
          variant: "destructive",
        });
        return;
      }

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader immédiatement
      uploadLogo.mutate(file);
    }
  };

  const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un fichier image valide.",
          variant: "destructive",
        });
        return;
      }

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader immédiatement
      uploadFavicon.mutate(file);
    }
  };

  const handleSave = () => {
    updateConfig.mutate(formData);
  };

  const handleDeleteLogo = () => {
    deleteLogo.mutate();
    setLogoPreview(null);
  };

  const handleDeleteFavicon = () => {
    deleteFavicon.mutate();
    setFaviconPreview(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement de la configuration de l'application.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuration de l'application
          </h1>
          <p className="text-muted-foreground mt-2">
            Personnalisez l'apparence et les informations de votre application
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {updateConfig.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informations de base
            </CardTitle>
            <CardDescription>
              Nom et description de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app_name">Nom de l'application</Label>
              <Input
                id="app_name"
                value={formData.app_name || ''}
                onChange={(e) => handleInputChange('app_name', e.target.value)}
                placeholder="SAKOM"
              />
            </div>
            <div>
              <Label htmlFor="app_description">Description</Label>
              <Textarea
                id="app_description"
                value={formData.app_description || ''}
                onChange={(e) => handleInputChange('app_description', e.target.value)}
                placeholder="Description de l'application"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logos et icônes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logos et icônes
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence visuelle de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo principal */}
            <div>
              <Label>Logo principal</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {logoPreview || config?.logo_url ? (
                    <img
                      src={logoPreview || config?.logo_url || ''}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadLogo.isPending}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadLogo.isPending ? 'Upload...' : 'Changer'}
                  </Button>
                  {(config?.logo_url || logoPreview) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteLogo}
                      disabled={deleteLogo.isPending}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Formats supportés: PNG, JPG, JPEG, SVG, WebP
              </p>
            </div>

            <Separator />

            {/* Favicon */}
            <div>
              <Label>Favicon</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {faviconPreview || config?.favicon_url ? (
                    <img
                      src={faviconPreview || config?.favicon_url || ''}
                      alt="Favicon"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadFavicon.isPending}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadFavicon.isPending ? 'Upload...' : 'Changer'}
                  </Button>
                  {(config?.favicon_url || faviconPreview) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteFavicon}
                      disabled={deleteFavicon.isPending}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                onChange={handleFaviconChange}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Formats supportés: PNG, JPG, JPEG, ICO (32x32px recommandé)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informations de l'entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations de l'entreprise
            </CardTitle>
            <CardDescription>
              Coordonnées et informations de contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Nom de votre entreprise"
              />
            </div>
            <div>
              <Label htmlFor="company_address">Adresse</Label>
              <Textarea
                id="company_address"
                value={formData.company_address || ''}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Adresse complète"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_phone">Téléphone</Label>
                <Input
                  id="company_phone"
                  value={formData.company_phone || ''}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  placeholder="+224 XXX XXX XXX"
                />
              </div>
              <div>
                <Label htmlFor="company_email">Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={formData.company_email || ''}
                  onChange={(e) => handleInputChange('company_email', e.target.value)}
                  placeholder="contact@entreprise.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company_website">Site web</Label>
              <Input
                id="company_website"
                type="url"
                value={formData.company_website || ''}
                onChange={(e) => handleInputChange('company_website', e.target.value)}
                placeholder="https://www.entreprise.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Couleurs du thème */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Couleurs du thème
            </CardTitle>
            <CardDescription>
              Personnalisez les couleurs de l'interface utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_color">Couleur principale</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={formData.primary_color || '#3B82F6'}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  id="primary_color"
                  value={formData.primary_color || ''}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#3B82F6"
                  className="font-mono"
                />
                <Badge 
                  style={{ backgroundColor: formData.primary_color || '#3B82F6' }}
                  className="text-white"
                >
                  Aperçu
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="secondary_color">Couleur secondaire</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={formData.secondary_color || '#6B7280'}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  id="secondary_color"
                  value={formData.secondary_color || ''}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  placeholder="#6B7280"
                  className="font-mono"
                />
                <Badge 
                  style={{ backgroundColor: formData.secondary_color || '#6B7280' }}
                  className="text-white"
                >
                  Aperçu
                </Badge>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Les couleurs doivent être au format hexadécimal (ex: #3B82F6). 
                Les changements seront appliqués après sauvegarde.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
