# PMD Ops — outil terrain MRCO

PWA mobile-first (français, heure du Maroc) pour l'équipe MRCO sur le **Partners’ Meeting** de Marrakech, 07 → 13 septembre 2026.

- **URL** : https://mlahbabi.github.io/pmd-ops/
- **Accès** : code à 6 chiffres, puis choix de l'utilisateur (Mehdi / Mouad / Eva / Farid).
- **Installer sur le téléphone** : ouvrir l'URL dans Safari (iPhone) ou Chrome (Android) → « Partager » / menu → « Sur l'écran d'accueil ». L'app fonctionne ensuite hors ligne.

## Mettre à jour (5 lignes)

1. Ouvrir Claude Code dans ce dossier (`C:\Users\mlahb\Documents\pmd-ops`).
2. Prompter la modification, ex. « Kopp finalement dîne à la Rôtisserie et repart le 11/09 par AF1077 ».
3. Claude modifie **uniquement** `src/data/*.json` et incrémente `version` / `updatedAt` du fichier touché.
4. `git commit` + `git push` sur `main`.
5. GitHub Actions rebuild et redéploie sur Pages en ~1 min. Les téléphones récupèrent la nouvelle version à la prochaine ouverture.

Aucune modification de code n'est nécessaire pour une mise à jour de données.

## Fichiers de données (`src/data/`)

| Fichier | Contenu |
|---|---|
| `participants.json` | 66 fiches (statut, VIP, séjour, régime, vols, vagues de transfert, tables, équipe TB, points ⚠️) |
| `timeline.json` | Séquences minute par minute 03 → 13/09 (type, niveau, checklist, personnes liées, `owner`) |
| `transport.json` | Règles d'or, 29 vagues aéroport + 6 transferts programme (dispatch V4), hors dispatch, flotte |
| `lieux.json` | 7 lieux + définition des 2 dîners (plans de table) |
| `menus.json` | 7 séquences de restauration |
| `contacts.json` | Contacts par groupe (tel / WhatsApp / email) |
| `signaletique.json` | Inventaire à installer, par jour |
| `team.json` | Membres MRCO, `affectations` (qui fait quoi, à compléter), `moments` |
| `pending.json` | Points en attente (état au 03/09 soir) |
| `express.json` | Marrakech Express : 7 équipes, liste navette 14h30 |

Les identifiants de personnes sont le nom en minuscules sans accents (`n-guessan`, `sall-plantagenet`). Les coches partagées sont indexées sur ces identifiants et sur les `id` des séquences : **ne pas renommer un `id` existant**, sinon les coches déjà faites ne s'affichent plus.

Affecter l'équipe (§10 de la spec) : dans `team.json`, ajouter des entrées `{ "sequenceId": "p1009-1430", "owner": "Eva", "role": "navette 14h30" }`. Les `sequenceId` sont ceux de `timeline.json` (les vagues transport ont le même id que dans `transport.json`).

## Changer le code d'accès

Le code n'est jamais stocké en clair : l'app compare une empreinte SHA-256, fournie au build par la variable `VITE_ACCESS_CODE_HASH`.

1. Calculer l'empreinte du nouveau code :

```bash
node -e "console.log(require('crypto').createHash('sha256').update('NOUVEAUCODE').digest('hex'))"
```

2. Sur GitHub : repo `mlahbabi/pmd-ops` → **Settings → Secrets and variables → Actions** → modifier `VITE_ACCESS_CODE_HASH` → coller l'empreinte.
3. Relancer le déploiement : onglet **Actions → « Déploiement GitHub Pages » → Run workflow** (ou n'importe quel push sur `main`).

Les utilisateurs déjà connectés restent connectés ; pour forcer une nouvelle saisie : Plus → Réglages → « Se déconnecter ». En développement local, mettre l'empreinte dans `.env.local` (voir `.env.example`). Sans variable, l'app accepte le code de développement `240826` et l'indique dans Réglages.

## Ajouter un utilisateur

Dans `src/data/team.json`, ajouter le prénom dans `membres`. Commit, push.

## Où sont les variables de build

GitHub → repo `mlahbabi/pmd-ops` → Settings → Secrets and variables → Actions :

| Variable | Rôle |
|---|---|
| `VITE_ACCESS_CODE_HASH` | Empreinte SHA-256 du code d'accès (définie) |
| `VITE_SUPABASE_URL` | URL du projet Supabase (à créer) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique `anon` du projet Supabase (à créer) |

Elles sont injectées au build par `.github/workflows/deploy.yml`. Rien n'est commité dans le code.

## État partagé en temps réel (Supabase)

**Configuré le 03/09/2026** : projet Supabase `pmd-ops` (organisation MRCO, région Francfort, réf. `acbxjftkudkkxfjuhfuy`), tables créées avec `supabase/schema.sql`, clé publique dans les secrets GitHub. Les 4 téléphones partagent les mêmes coches et le même fil terrain. Tableau de bord : https://supabase.com/dashboard/project/acbxjftkudkkxfjuhfuy (compte GitHub `mlahbabi`).

Si l'app affiche le bandeau **« mode local »**, c'est que les variables Supabase manquent au build. Pour (re)configurer :

1. Créer un projet gratuit sur https://supabase.com (région Europe).
2. SQL Editor → coller `supabase/schema.sql` → Run.
3. Project Settings → API : copier `Project URL` et la clé `anon public`.
4. Les renseigner dans GitHub (Settings → Secrets and variables → Actions) sous `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
5. Relancer le déploiement (Actions → Run workflow, ou un push).

Le code Supabase est déjà en place (`src/lib/store.ts`) : lecture au démarrage, Realtime sur `checks` et `notes`, file d'attente hors ligne resynchronisée au retour du réseau.

## Développement local

```bash
npm install
```

```bash
npm run dev
```

Puis http://localhost:5173/pmd-ops/ (code `240826` sans `.env.local`). `npm run build` produit `dist/` ; `npm run preview` sert le build avec le service worker.

## Structure

```
src/
  data/           ← JSON de données (seuls fichiers à modifier pour une mise à jour)
  lib/            ← types, accès données, temps (Maroc), store partagé, code d'accès
  components/     ← Layout, cartes séquence / vague, plan de table, UI
  screens/        ← Maintenant, Programme, Personnes, Transport, Lieux, Plus
supabase/schema.sql
.github/workflows/deploy.yml
```

Règles absolues respectées dans les données : aucun montant ni tarif, « Partners’ Meeting » et « Marrakech Express » uniquement.
