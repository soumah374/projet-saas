# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

project_saas is a comprehensive business management platform for service companies, handling the complete workflow from quotes (devis) to contracts to invoicing. Built with Django (backend) and React + TypeScript (frontend).

**Key Business Flow:** Devis → Contrat → Échéancier → Factures

## Development Commands

### Backend (Django)

```bash
cd backend

# Database operations
python manage.py makemigrations [app_name]  # Create migrations
python manage.py migrate                     # Apply migrations
python manage.py createsuperuser            # Create admin user

# Initialize permissions system
python manage.py init_permissions

# Run development server
python manage.py runserver

# Access Django shell
python manage.py shell

# Environment: Uses django-environ via /Users/salam/Documents/dev/django_classes/.env/
```

### Frontend (React + TypeScript)

```bash
cd frontend

npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Testing

Currently no automated test suite. Manual testing through UI and Django admin.

## Architecture Overview

### Backend Structure (Django)

**Core Business Apps:**
- `contrats/` - Contract management (Contrat, LigneContrat, EcheancierContrat, Avenant)
- `devis/` - Quote/estimate management (Devis, LigneDevis)
- `billings/` - Invoicing (Facture, LigneFacture, ConfigurationFacturation)
- `catalog/` - Service catalog (Service, Activity, FraisCategory, IntervenantProfile)
- `users/` - User management with role-based permissions
- `projects/` - Project management
- `teams/` - Team and department management
- `dashboard/` - Dashboard widgets and analytics
- `email_templates/` - Templated email system

**Key Model Relationships:**
```
Devis (Quote)
  └─> LigneDevis (Quote lines)
      └─> copied to → LigneContrat when creating Contrat
                          ├─> ligne_devis FK (reference to original)
                          └─> can be marked as 'retiree' (withdrawn)

Contrat (Contract)
  ├─> lignes: LigneContrat[] (contract lines with statut: 'active'|'retiree')
  ├─> echeances: EcheancierContrat[] (payment schedules)
  │     └─> lignes: LigneEcheancierContrat[] (individual payment milestones)
  ├─> historique_montants: ContratHistoriqueMontant[] (amount change history)
  └─> devis: ManyToMany (can be created from multiple quotes)

LigneEcheancierContrat (Payment milestone)
  └─> Facture (Invoice, via ligne_echeancier FK)
```

**Important Model Behaviors:**
- `LigneContrat.save()` automatically calls `contrat.calculer_montants()` and `update_contenu_from_articles()`
- `Contrat.calculer_montants()` only includes lines with `statut='active'`
- When withdrawing a line, use `LigneContrat.objects.filter(id=x).update()` to avoid triggering save signals
- Amount calculations cascade: Contrat → Échéances → Factures

### Frontend Structure (React + TypeScript)

**Directory Layout:**
```
src/
├── components/          # Reusable UI components (shadcn/ui based)
├── pages/              # Page components (one per route)
├── hooks/              # Custom React hooks
│   ├── use-contrats.ts      # Contract operations
│   ├── use-devis.ts         # Quote operations
│   ├── use-echeances.ts     # Payment schedule operations
│   ├── use-permissions.ts   # Permission checking
│   └── use-*.ts             # Module-specific hooks
├── lib/
│   ├── api.ts          # Axios instance + API function definitions
│   ├── types.ts        # TypeScript type definitions
│   ├── config.ts       # Environment configuration
│   └── utils.ts        # Utility functions
└── services/           # Business logic services
```

**API Communication Pattern:**
1. API functions defined in `lib/api.ts` (e.g., `contratsAPI.retirerLigneContrat()`)
2. React Query hooks in `hooks/use-*.ts` wrap API calls with mutations/queries
3. Components use hooks, mutations auto-invalidate queries on success

**State Management:**
- React Query (`@tanstack/react-query`) for server state
- Local component state for UI state
- No Redux/Zustand - server state comes from React Query cache

## Critical Implementation Patterns

### Permission System

Django uses custom permission classes in `users/permissions.py`:
- `RoleBasedPermission` - Maps roles to module permissions
- Model-level permissions checked via Django groups
- Field-level permissions via `ProtectedField` component in frontend

Frontend permission checking:
```typescript
const { hasPermission } = usePermissions();
if (hasPermission('contrats.can_edit_contrat')) {
  // Show edit button
}
```

### Line Withdrawal Pattern (Important!)

When withdrawing a contract line (`LigneContrat`):

1. **Backend (`Contrat.retirer_ligne()`):**
   - Wrap in `transaction.atomic()`
   - Use `LigneContrat.objects.filter(id=x).update()` NOT `ligne.save()` (avoids triggering recalculation)
   - Mark line as `statut='retiree'`
   - Call `calculer_montants()` manually once
   - Create `ContratHistoriqueMontant` entry
   - Recalculate unpaid échéances using `bulk_update()`
   - Update unpaid factures, reload échéances with `.get()` to ensure fresh data

2. **Frontend:**
   - After mutation, invalidate queries: `['contrat', id]`, `['contrat-historique-montant', id]`
   - Call `loadEcheances()` to refresh payment schedules
   - UI shows withdrawn lines grayed out with red comment

### Amount Calculation Flow

```
Line Change → calculer_montants() saves to DB
  ↓
recalculer_echeances_impayees()
  - Filters statut='en_attente'
  - Recalculates: montant = contrat.montant * (pourcentage/100)
  - Uses bulk_update()
  ↓
mettre_a_jour_factures_non_payees()
  - Filters statut in ['brouillon', 'emise', 'envoyee', 'en_retard']
  - Reloads échéances from DB (fresh data!)
  - Updates facture amounts + recreates LigneFacture
  - Uses bulk_update()
```

### Contract Creation from Quotes

When creating a contract from quotes (`create_from_devis`):
1. Copies `LigneDevis` to `LigneContrat` with `ligne_devis` FK reference
2. Copies `LigneDevisIntervenant` to `LigneContratIntervenant`
3. Creates `EcheancierContrat` with `LigneEcheancierContrat` based on payment schedule config
4. Original quote remains unchanged (read-only reference)

**Note:** `ligne_devis` FK added recently - enables tracking line origin and marking original quote lines as withdrawn

## Database Migrations

Django migrations live in `backend/*/migrations/`. After model changes:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

**Common Issues:**
- If migration fails on `montant_*_avant/apres` fields, check model has all required fields
- Use `metadata` JSONField for storing extra data that doesn't warrant a column
- Always include `default` or `null=True` for new fields on existing tables

## Key Configuration Files

- `backend/config/settings.py` - Django settings, uses django-environ
- `frontend/src/lib/config.ts` - Frontend config (API URL from env)
- `frontend/vite.config.ts` - Vite build configuration
- Virtual env at `/Users/salam/Documents/dev/django_classes/.env/` (shared location)

## API Endpoints Pattern

Django REST Framework ViewSets with custom actions:
```python
@action(detail=True, methods=['post'], url_path="retirer-ligne")
def retirer_ligne(self, request, pk=None):
    contrat = self.get_object()
    # ... implementation
```

Frontend calls via hooks:
```typescript
export const useRetirerLigneContrat = () => {
  return useMutation({
    mutationFn: (data) => contratsAPI.retirerLigneContrat(...),
    onSuccess: () => {
      queryClient.invalidateQueries({...});
    }
  });
}
```

## UI Component Library

Uses **shadcn/ui** (Radix UI primitives + Tailwind):
- Components in `frontend/src/components/ui/`
- Customizable via `tailwind.config.ts`
- Import from `@/components/ui/button` etc.
- Toast notifications via `sonner` library

## Common Gotchas

1. **LigneContrat.save() side effects** - Automatically recalculates contract amounts. Use `update()` to bypass.
2. **Échéances only recalculated for statut='en_attente'** - Paid/canceled échéances are immutable.
3. **Facture.ligne_echeancier FK** - Invoice tied to specific payment milestone, not just contract.
4. **Permission checks** - Backend checks on ViewSets, frontend checks in components (can be bypassed).
5. **React Query cache** - Must manually invalidate after mutations or data stays stale.
6. **Transaction isolation** - Use `transaction.atomic()` for multi-step operations that must succeed/fail together.

## Business Logic Notes

- **Devis statuses:** brouillon, envoye, accepte, refuse, expire
- **Contrat statuses:** brouillon, actif, terminé, annulé, suspendu, archivé, envoyé, signé, cloturé
- **Échéance statuses:** en_attente, paye, en_retard, annule
- **Facture statuses:** brouillon, emise, envoyee, payee, en_retard, annulee, partiellement_payee

Amount fields consistently named: `montant_ht`, `montant_tva`, `montant_frais_agence`, `montant_ttc`

## Security

- JWT authentication (access + refresh tokens in localStorage)
- 401 responses trigger auto-logout via axios interceptor
- CORS configured in Django settings
- Role-based permissions via Django groups
- Field-level permissions on sensitive data (montants, etc.)
