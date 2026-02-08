# 🚀 Quick Deploy Setup

Script pour configurer rapidement le déploiement SSH vers le VPS.

## Usage rapide

```bash
./scripts/setup-ssh-deploy.sh <VPS_IP_ou_hostname> <VPS_USER> [SSH_PORT]
```

### Exemple

```bash
./scripts/setup-ssh-deploy.sh 203.0.113.42 ubuntu 22
```

Ou avec un hostname :

```bash
./scripts/setup-ssh-deploy.sh vps.example.com ubuntu
```

## Ce que fait le script

1. ✅ Génère une paire de clés SSH (`ed25519`)
2. ✅ Installe la clé publique sur le VPS
3. ✅ Teste la connexion SSH
4. ✅ Affiche les commandes pour configurer les secrets GitHub
5. ✅ Optionnel : configure automatiquement les secrets via `gh` CLI

## Prérequis

- SSH accessible sur le VPS (port 22 par défaut)
- Utilisateur SSH valide avec sudo ou accès direct
- (Optionnel) `gh` CLI installée pour auto-configurer les secrets

## Secrets configurés

Le script configure automatiquement ces secrets dans GitHub :

| Secret            | Valeur                                |
| ----------------- | ------------------------------------- |
| `VPS_HOST`        | Adresse IP ou hostname du VPS         |
| `VPS_USER`        | Utilisateur SSH (ex : ubuntu)         |
| `VPS_SSH_PORT`    | Port SSH (22 par défaut)              |
| `VPS_SSH_KEY`     | Clé privée SSH (contenu `deploy_key`) |
| `VPS_DEPLOY_PATH` | Chemin du projet sur VPS              |

## Dépannage

### Erreur: "Permission denied (publickey)"

Vérifiez que la clé publique est bien installée sur le VPS :

```bash
ssh -i deploy_key ubuntu@VPS_IP "cat ~/.ssh/authorized_keys | grep -i 'github-actions'"
```

### Erreur: "Connection refused"

Vérifiez le port SSH et l'adresse IP :

```bash
ssh -p 22 -i deploy_key ubuntu@VPS_IP "echo ok"
```

### Le script ne trouve pas `gh` CLI

Installez-la d'abord : https://cli.github.com/

Ou configurez manuellement les secrets :

```bash
# Dans GitHub : Settings → Secrets → Actions → New secret
# Copiez le contenu de deploy_key dans VPS_SSH_KEY
cat deploy_key
```

## Sécurité

⚠️ **Important** : Le fichier `deploy_key` (clé privée) donne accès au VPS.

- Ne le commit pas dans le repo (`.gitignore` doit l'exclure)
- Stockez-le de manière sécurisée
- Régénérez-le si compromis

## Workflow de déploiement

Après configuration :

1. Poussez sur la branche `develop` (ou `main` selon le workflow)
2. GitHub Actions build le backend & frontend
3. Push les images vers GHCR
4. Déploie sur le VPS via SSH + SCP
5. Redémarre les services

Consultez les logs dans **Actions → Latest run** pour le statut.
