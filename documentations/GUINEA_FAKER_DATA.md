# Données Guinéennes pour les Fakers

## Vue d'ensemble

Les fakers ont été adaptés pour utiliser des données géographiques guinéennes et d'Afrique de l'Ouest, offrant une expérience plus locale et réaliste pour les utilisateurs guinéens.

## Villes Guinéennes

### **Villes principales (26 villes)**

1. **Conakry** - Capitale et plus grande ville
2. **Kankan** - Ville historique et commerciale
3. **Kindia** - Centre agricole et industriel
4. **Boké** - Port et centre minier
5. **Labé** - Capitale du Fouta Djallon
6. **Kissidougou** - Centre commercial régional
7. **Faranah** - Ville historique
8. **Nzérékoré** - Capitale de la Guinée forestière
9. **Mamou** - Centre administratif
10. **Siguiri** - Ville minière
11. **Kouroussa** - Centre agricole
12. **Dabola** - Ville de transit
13. **Kérouané** - Centre commercial
14. **Mandiana** - Ville frontalière
15. **Télimélé** - Centre administratif
16. **Pita** - Ville touristique
17. **Dalaba** - Station climatique
18. **Coyah** - Ville périurbaine
19. **Forécariah** - Ville côtière
20. **Dubréka** - Ville périurbaine
21. **Boffa** - Ville côtière
22. **Fria** - Ville industrielle
23. **Gaoual** - Ville administrative
24. **Lélouma** - Ville rurale
25. **Tougué** - Ville administrative
26. **Koundara** - Ville frontalière

### **Répartition par région**

- **Conakry** : Capitale et zone urbaine
- **Basse-Guinée** : Coyah, Forécariah, Dubréka, Boffa, Fria
- **Moyenne-Guinée** : Labé, Mamou, Télimélé, Pita, Dalaba, Gaoual, Lélouma, Tougué
- **Haute-Guinée** : Kankan, Siguiri, Kouroussa, Dabola, Kérouané, Mandiana
- **Guinée Forestière** : Kissidougou, Nzérékoré, Koundara

## Pays d'Afrique de l'Ouest

### **Pays inclus (10 pays)**

1. **Guinée** - Pays principal
2. **Sénégal** - Pays voisin
3. **Mali** - Pays voisin
4. **Côte d'Ivoire** - Pays voisin
5. **Burkina Faso** - Pays voisin
6. **Niger** - Pays de la région
7. **Togo** - Pays de la région
8. **Bénin** - Pays de la région
9. **Ghana** - Pays de la région
10. **Nigeria** - Plus grand pays de la région

### **Répartition géographique**

- **Guinée** : 40% (pays principal)
- **Pays voisins** : 35% (Sénégal, Mali, Côte d'Ivoire, Burkina Faso)
- **Autres pays** : 25% (Niger, Togo, Bénin, Ghana, Nigeria)

## Secteurs d'activité adaptés

### **Secteurs pertinents pour la Guinée**

- **Mines** - Bauxite, or, diamants, fer
- **Agriculture** - Riz, café, cacao, fruits
- **Élevage** - Bovins, ovins, caprins
- **Pêche** - Pêche maritime et fluviale
- **Transport** - Logistique, transport routier
- **Commerce** - Import-export, distribution
- **Services** - Banque, assurance, consulting
- **Construction** - BTP, immobilier
- **Énergie** - Hydroélectricité, énergies renouvelables
- **Télécommunications** - Opérateurs, services IT

### **Types d'entreprises guinéennes**

- **SARL** - Société à responsabilité limitée
- **SA** - Société anonyme
- **SNC** - Société en nom collectif
- **Association** - Organisations à but non lucratif
- **Coopérative** - Coopératives agricoles
- **GIE** - Groupement d'intérêt économique

## Données réalistes

### **Codes postaux guinéens**

- Format : 5 chiffres (ex: 00100 pour Conakry)
- Génération automatique par Faker

### **Numéros de téléphone**

- Format guinéen : +224 XX XXX XXX
- Génération automatique par Faker

### **Adresses**

- Adresses réalistes des villes guinéennes
- Quartiers et rues typiques
- Génération automatique par Faker

## Utilisation

### **Génération avec données guinéennes**

```bash
# Générer des clients avec des données guinéennes
python manage.py generate_fake_clients --count 100

# Générer des catégories
python manage.py generate_fake_client_categories
```

### **Exemples de données générées**

```python
# Personne physique
{
    'nom': 'Diallo',
    'prenom': 'Mamadou',
    'email': 'mamadou.diallo@example.com',
    'telephone': '+224 623 456 789',
    'ville': 'Conakry',
    'pays': 'Guinée',
    'adresse': '123 Rue du Commerce, Kaloum'
}

# Personne morale
{
    'raison_sociale': 'Société Minière Excellence',
    'rccm_nif': 'RCCM12345678',
    'contact': 'Fatoumata Camara',
    'ville': 'Kankan',
    'pays': 'Guinée',
    'adresse': '456 Avenue de l\'Indépendance'
}
```

## Avantages

### **Réalisme local**

- Données géographiques pertinentes
- Noms et prénoms locaux
- Secteurs d'activité adaptés

### **Cohérence culturelle**

- Respect des usages locaux
- Adaptation aux réalités guinéennes
- Données crédibles pour les utilisateurs

### **Facilité d'utilisation**

- Génération automatique
- Pas de configuration supplémentaire
- Compatible avec l'existant

## Personnalisation

### **Ajouter de nouvelles villes**

```python
villes_guineennes = [
    # ... villes existantes ...
    'Nouvelle Ville'
]
```

### **Modifier les pays**

```python
pays = [
    # ... pays existants ...
    'Nouveau Pays'
]
```

### **Ajouter des secteurs**

```python
secteurs = [
    # ... secteurs existants ...
    'Nouveau Secteur'
]
```

## Statistiques attendues

### **Répartition par ville**

- **Conakry** : ~30% (capitale)
- **Autres grandes villes** : ~40% (Kankan, Kindia, Labé, etc.)
- **Villes moyennes** : ~30% (autres villes)

### **Répartition par pays**

- **Guinée** : ~40%
- **Pays voisins** : ~35%
- **Autres pays** : ~25%

### **Répartition par secteur**

- **Commerce** : ~25%
- **Services** : ~20%
- **Agriculture** : ~15%
- **Mines** : ~10%
- **Autres** : ~30%

Cette adaptation rend les fakers plus pertinents et réalistes pour un contexte guinéen !
