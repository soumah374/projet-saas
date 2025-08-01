# Mise à jour du ContractEditor - Téléchargement PDF via Backend

## 🎯 Changements Apportés

Le composant `ContractEditor` a été mis à jour pour utiliser l'endpoint backend `/api/v1/contrats/contrats/{id}/download_pdf/` au lieu de la génération PDF côté client.

## ✅ Modifications Principales

### 1. **Suppression des dépendances côté client**

- ❌ Supprimé : `jsPDF` et `html2canvas`
- ✅ Ajouté : Import de `api` depuis `@/lib/api`

### 2. **Nouvelle fonction `handleGeneratePDF`**

```typescript
const handleGeneratePDF = async () => {
  setIsGeneratingPDF(true);

  try {
    // Sauvegarder d'abord le contrat édité s'il y a des modifications
    if (isEditingContract && onSave) {
      await onSave(editedContract);
    }

    // Télécharger le PDF depuis l'endpoint backend
    const response = await api.get(
      `/contrats/contrats/${contrat.id}/download_pdf/`,
      {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      }
    );

    // Créer un lien de téléchargement
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contrat-${contrat.numero}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success("PDF téléchargé avec succès");
  } catch (error) {
    console.error("Erreur lors du téléchargement PDF:", error);
    toast.error("Erreur lors du téléchargement du PDF");
  } finally {
    setIsGeneratingPDF(false);
  }
};
```

### 3. **Interface simplifiée**

```typescript
interface ContractEditorProps {
  contrat: any;
  devis: any;
  onSave?: (contenuPersonnalise: string) => void;
  // ❌ Supprimé : onGeneratePDF?: (contractText: string) => void;
}
```

## 🚀 Avantages de la Nouvelle Approche

### **Côté Backend**

- ✅ **Génération PDF professionnelle** avec WeasyPrint
- ✅ **Variables automatiquement remplacées** depuis la base de données
- ✅ **Template HTML cohérent** avec les standards de l'entreprise
- ✅ **Gestion d'erreurs centralisée**
- ✅ **Performance optimisée** (pas de génération côté client)

### **Côté Frontend**

- ✅ **Code simplifié** (moins de dépendances)
- ✅ **Téléchargement direct** du PDF généré
- ✅ **Sauvegarde automatique** avant génération
- ✅ **Feedback utilisateur** avec toasts
- ✅ **Gestion d'erreurs** améliorée

## 📋 Utilisation

### **Composant de base**

```typescript
import { ContractEditor } from "@/components/ContractEditor";

function ContratPage() {
  const handleSave = async (contenuPersonnalise: string) => {
    // Sauvegarder le contenu personnalisé
    await api.patch(`/contrats/contrats/${contrat.id}/`, {
      contenu_personnalise,
    });
  };

  return <ContractEditor contrat={contrat} devis={devis} onSave={handleSave} />;
}
```

### **Fonctionnalités disponibles**

1. **Édition** : Éditeur WYSIWYG pour modifier le contenu
2. **Aperçu** : Visualisation du contrat avant génération
3. **Sauvegarde** : Sauvegarde automatique des modifications
4. **Téléchargement PDF** : Génération et téléchargement via backend
5. **Copie** : Copie du contenu dans le presse-papiers

## 🔧 Configuration Requise

### **Backend**

- ✅ Endpoint `/api/v1/contrats/contrats/{id}/download_pdf/` fonctionnel
- ✅ WeasyPrint installé et configuré
- ✅ Authentification JWT active
- ✅ Permissions admin configurées

### **Frontend**

- ✅ API client configuré (`@/lib/api`)
- ✅ Authentification JWT active
- ✅ Toast notifications configurées

## 🧪 Test de la Fonctionnalité

### **Test manuel**

1. Ouvrir un contrat dans l'éditeur
2. Modifier le contenu si nécessaire
3. Cliquer sur "Générer PDF"
4. Vérifier le téléchargement du fichier

### **Test automatique**

```typescript
// Test de l'endpoint
const response = await api.get(`/contrats/contrats/1/download_pdf/`, {
  responseType: "blob",
});

expect(response.status).toBe(200);
expect(response.headers["content-type"]).toBe("application/pdf");
```

## 🐛 Gestion d'Erreurs

### **Erreurs courantes**

- **401 Unauthorized** : Token d'authentification manquant ou expiré
- **404 Not Found** : Contrat introuvable
- **500 Internal Server Error** : Erreur de génération PDF

### **Messages utilisateur**

- ✅ "PDF téléchargé avec succès"
- ❌ "Erreur lors du téléchargement du PDF"

## 📦 Dépendances Supprimées

```json
{
  "dependencies": {
    "jspdf": "❌ Supprimé",
    "html2canvas": "❌ Supprimé"
  }
}
```

## 🎉 Résultat Final

Le composant `ContractEditor` est maintenant :

- ✅ **Plus simple** à maintenir
- ✅ **Plus performant** (génération côté serveur)
- ✅ **Plus fiable** (PDF professionnel)
- ✅ **Plus cohérent** avec l'architecture backend
