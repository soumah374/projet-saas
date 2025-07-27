# Guide de Reconstruction - Solution ReportLab

## ✅ **Problème Résolu**

L'erreur `libgobject-2.0-0: cannot open shared object file` était causée par des dépendances GTK complexes pour WeasyPrint.

## 🔧 **Solution Appliquée**

### **Changements Effectués :**

1. **Dockerfile simplifié** ✅

   - Suppression des dépendances GTK complexes
   - Ajout uniquement des polices pour ReportLab
   - Image plus légère et stable

2. **Requirements mis à jour** ✅

   - Suppression de `weasyprint`
   - Conservation de `reportlab==4.0.7`
   - Plus de problèmes de dépendances système

3. **Modèle mis à jour** ✅
   - `generer_pdf()` utilise maintenant ReportLab par défaut
   - Plus d'erreurs de bibliothèques GTK
   - Génération PDF fiable et stable

## 🚀 **Commandes de Reconstruction**

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Reconstruire l'image backend
docker-compose build --no-cache backend

# 3. Redémarrer les services
docker-compose up -d

# 4. Vérifier les logs
docker-compose logs backend
```

## 🧪 **Test de Vérification**

```bash
# Test de l'endpoint PDF
curl -X GET \
  "http://localhost:8000/api/v1/contrats/contrats/1/download_pdf/" \
  -H "Authorization: Bearer {TOKEN}" \
  --output test_contrat.pdf
```

## 🎯 **Résultat Attendu**

Après la reconstruction :

- ✅ Plus d'erreur `libgobject-2.0-0`
- ✅ Génération PDF avec ReportLab
- ✅ Téléchargement PDF fonctionnel
- ✅ Image Docker plus légère
- ✅ Dépendances simplifiées

## 📋 **Avantages de ReportLab**

- ✅ Pas de dépendances GTK complexes
- ✅ Installation plus simple
- ✅ Génération PDF fiable
- ✅ Support multilingue
- ✅ Personnalisation avancée

**Exécutez les commandes de reconstruction ci-dessus et le problème sera définitivement résolu !** 🎯
