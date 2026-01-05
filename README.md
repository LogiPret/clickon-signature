# ClickOn Signature - Application de signature de contrat

Application React permettant aux utilisateurs de consulter un contrat PDF et de le signer electroniquement.

## Fonctionnalites

- Formulaire de signature avec informations personnelles (prenom, nom, courriel, telephone)
- Visualiseur PDF integre avec navigation et zoom
- Cases a cocher de consentement conformes aux exigences legales
- Champ de confirmation avec saisie obligatoire de "j'accepte"
- Stockage des signatures dans Supabase
- Interface entierement en francais
- Design responsive et accessible

## Technologies

- React 18 + TypeScript
- Vite
- Tailwind CSS
- react-pdf pour l'affichage des PDF
- Supabase pour la base de donnees
- Lucide React pour les icones

## Installation

1. Clonez le depot et installez les dependances :

```bash
npm install
```

2. Copiez le fichier d'environnement et configurez vos cles Supabase :

```bash
cp .env.example .env
```

3. Modifiez `.env` avec vos credentials Supabase :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

4. Creez la table dans Supabase en executant le script SQL :

```bash
# Copiez le contenu de supabase/schema.sql dans l'editeur SQL de Supabase
```

5. Ajoutez votre fichier PDF de contrat :

```bash
# Placez votre fichier PDF dans public/contract.pdf
```

6. Lancez le serveur de developpement :

```bash
npm run dev
```

## Configuration Supabase

1. Creez un projet sur [supabase.com](https://supabase.com)
2. Allez dans SQL Editor et executez le script `supabase/schema.sql`
3. Copiez l'URL du projet et la cle anon depuis Settings > API
4. Collez-les dans votre fichier `.env`

## Structure du projet

```
src/
  components/
    SignatureForm.tsx    # Formulaire principal
    PDFViewer.tsx        # Composant de visualisation PDF
  lib/
    supabase.ts          # Client et fonctions Supabase
  App.tsx                # Composant racine
  main.tsx               # Point d'entree
  index.css              # Styles Tailwind
public/
  contract.pdf           # Fichier PDF du contrat (a ajouter)
supabase/
  schema.sql             # Schema de base de donnees
```

## Conformite legale

L'application respecte les exigences de la Loi concernant le cadre juridique des technologies de l'information (LCCJTI) du Quebec pour les signatures electroniques :

- Horodatage de la signature
- Enregistrement du user agent
- Consentement explicite via checkbox
- Confirmation ecrite ("j'accepte")
- Politique de protection des donnees

## Deploiement

```bash
npm run build
```

Les fichiers de production seront generes dans le dossier `dist/`.
