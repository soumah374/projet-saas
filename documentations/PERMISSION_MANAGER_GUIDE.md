# 🛡️ Guide du Gestionnaire de Permissions

## Vue d'ensemble

Le gestionnaire de permissions permet aux administrateurs de gérer graphiquement les rôles et permissions du système. Il offre une interface intuitive pour créer, modifier et supprimer des rôles et permissions.

## 🚀 Fonctionnalités

### 1. Gestion des Rôles

- ✅ **Créer** de nouveaux rôles
- ✅ **Supprimer** des rôles existants
- ✅ **Voir** la liste des rôles avec le nombre d'utilisateurs
- ✅ **Éditer** les permissions d'un rôle

### 2. Gestion des Permissions

- ✅ **Créer** de nouvelles permissions
- ✅ **Supprimer** des permissions existantes
- ✅ **Voir** toutes les permissions organisées par module
- ✅ **Permissions dynamiques** depuis la base de données

### 3. Attribution des Permissions

- ✅ **Sélectionner** un rôle pour configurer ses permissions
- ✅ **Switches** pour activer/désactiver les permissions par module
- ✅ **Mise à jour en temps réel** des permissions

## 📋 Modules Supportés

| Module          | Permissions                      |
| --------------- | -------------------------------- |
| **Users**       | Voir, Créer, Modifier, Supprimer |
| **Projects**    | Voir, Créer, Modifier, Supprimer |
| **Teams**       | Voir, Créer, Modifier, Supprimer |
| **Departments** | Voir, Créer, Modifier, Supprimer |
| **Clients**     | Voir, Créer, Modifier, Supprimer |
| **Devis**       | Voir, Créer, Modifier, Supprimer |
| **Contrats**    | Voir, Créer, Modifier, Supprimer |
| **Billings**    | Voir, Créer, Modifier, Supprimer |
| **Catalog**     | Voir, Créer, Modifier, Supprimer |
| **Documents**   | Voir, Créer, Modifier, Supprimer |
| **Reports**     | Voir, Créer, Modifier, Supprimer |
| **Calendar**    | Voir, Créer, Modifier, Supprimer |
| **Timesheets**  | Voir, Créer, Modifier, Supprimer |

## 🔧 Installation et Configuration

### 1. Backend (Django)

Les endpoints suivants ont été ajoutés dans `backend/users/views.py` :

```python
# Endpoints disponibles
GET    /api/v1/auth/users/permissions/roles/              # Liste des rôles
POST   /api/v1/auth/users/permissions/create_role/        # Créer un rôle
DELETE /api/v1/auth/users/permissions/delete_role/{name}/ # Supprimer un rôle

GET    /api/v1/auth/users/permissions/permissions/        # Liste des permissions
POST   /api/v1/auth/users/permissions/create_permission/  # Créer une permission
DELETE /api/v1/auth/users/permissions/delete_permission/{name}/ # Supprimer une permission

GET    /api/v1/auth/users/permissions/role-permissions/   # Permissions des rôles
PUT    /api/v1/auth/users/permissions/update_role_permissions/{name}/ # Mettre à jour les permissions

GET    /api/v1/auth/users/permissions/role_users/{name}/  # Utilisateurs d'un rôle
POST   /api/v1/auth/users/permissions/assign_user_to_role/{name}/ # Assigner un utilisateur
DELETE /api/v1/auth/users/permissions/remove_user_from_role/{name}/{user_id}/ # Retirer un utilisateur
```

### 2. Frontend (React)

Le gestionnaire est accessible via :

- **Route** : `/permissions`
- **Lien sidebar** : Icône Shield (visible pour les utilisateurs staff)
- **Protection** : Seuls les utilisateurs staff peuvent y accéder

## 🎯 Utilisation

### 1. Accéder au Gestionnaire

1. Connectez-vous en tant qu'administrateur
2. Cliquez sur l'icône **Shield** dans la sidebar
3. Vous arrivez sur la page de gestion des permissions

### 2. Gérer les Rôles

#### Créer un nouveau rôle :

1. Allez dans l'onglet **"Rôles"**
2. Cliquez sur **"Nouveau Rôle"**
3. Entrez le nom du rôle (ex: "Consultant Senior")
4. Cliquez sur **"Créer"**

#### Supprimer un rôle :

1. Dans la liste des rôles
2. Cliquez sur **"Supprimer"** à côté du rôle
3. Confirmez la suppression

### 3. Gérer les Permissions

#### Créer une nouvelle permission :

1. Allez dans l'onglet **"Permissions"**
2. Cliquez sur **"Nouvelle Permission"**
3. Entrez le nom au format `module.action` (ex: `projects.advanced_edit`)
4. Cliquez sur **"Créer"**

#### Supprimer une permission :

1. Dans la liste des permissions
2. Cliquez sur **"Supprimer"** à côté de la permission
3. Confirmez la suppression

### 4. Attribuer des Permissions

#### Configurer les permissions d'un rôle :

1. Allez dans l'onglet **"Attributions"**
2. Sélectionnez un rôle dans le menu déroulant
3. Pour chaque module, activez/désactivez les permissions :
   - ✅ **Voir** : Permet de consulter les éléments
   - ✅ **Créer** : Permet de créer de nouveaux éléments
   - ✅ **Modifier** : Permet de modifier les éléments existants
   - ✅ **Supprimer** : Permet de supprimer des éléments

## 🔒 Sécurité

### Permissions Requises

- Seuls les utilisateurs avec `is_staff=True` peuvent accéder au gestionnaire
- Toutes les opérations nécessitent des permissions d'administrateur

### Validation

- Les permissions sont validées côté serveur
- Les rôles ne peuvent pas être supprimés s'ils ont des utilisateurs
- Les permissions ne peuvent pas être supprimées si elles sont utilisées

## 🧪 Tests

### Tester les Endpoints

Exécutez le script de test :

```bash
cd backend
python test_permission_endpoints.py
```

### Tester l'Interface

1. Démarrez le serveur backend :

```bash
cd backend
python manage.py runserver
```

2. Démarrez le frontend :

```bash
cd frontend
npm run dev
```

3. Connectez-vous en tant qu'administrateur
4. Accédez à `/permissions`
5. Testez toutes les fonctionnalités

## 🐛 Dépannage

### Erreurs Courantes

#### 404 Not Found

- Vérifiez que les URLs sont correctes
- Assurez-vous que le serveur backend est démarré
- Vérifiez que les migrations sont appliquées

#### 403 Forbidden

- Vérifiez que l'utilisateur a les permissions staff
- Vérifiez que le token d'authentification est valide

#### 500 Internal Server Error

- Vérifiez les logs du serveur Django
- Assurez-vous que la base de données est accessible

### Logs

Les erreurs sont loggées dans :

- **Frontend** : Console du navigateur
- **Backend** : Logs Django (`python manage.py runserver`)

## 📈 Évolutions Futures

### Fonctionnalités Prévues

- [ ] **Interface drag & drop** pour réorganiser les permissions
- [ ] **Templates de rôles** prédéfinis
- [ ] **Historique des modifications** des permissions
- [ ] **Export/Import** des configurations de permissions
- [ ] **Permissions granulaires** par projet/équipe
- [ ] **Notifications** lors des changements de permissions

### Améliorations Techniques

- [ ] **Cache** des permissions pour améliorer les performances
- [ ] **API GraphQL** pour des requêtes plus flexibles
- [ ] **Webhooks** pour synchroniser avec d'autres systèmes
- [ ] **Audit trail** complet des modifications

## 📞 Support

Pour toute question ou problème :

1. Consultez les logs d'erreur
2. Vérifiez la documentation technique
3. Contactez l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Auteur** : Équipe de développement project_saas
