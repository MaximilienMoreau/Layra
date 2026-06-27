<div align="center">

# ⚡ Layra

**Convertissez vos images PNG & JPEG en SVG vectoriels parfaits.**
Deux modes : traitement local gratuit, ou vectorisation IA haute qualité.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

</div>

## ✨ Fonctionnalités

| | |
|---|---|
| ⚡ **Mode Rapide** | Traitement 100% local via `imagetracerjs` — gratuit, aucune donnée envoyée |
| ✦ **Mode IA** | Résultats haute qualité sur photos et visuels complexes via API externe |
| 🖱️ **Drag & drop** | Glissez votre image ou cliquez pour sélectionner (PNG, JPEG, WebP) |
| 🔍 **Aperçu avant/après** | Comparaison côte à côte avec fond damier pour la transparence SVG |
| ⬇️ **Téléchargement direct** | Fichier `.svg` propre, léger, scalable à l'infini |
| 🌙 **Thème sombre / clair** | Bascule en un clic, préférence persistée dans `localStorage` |
| 🪙 **Crédits** | 500 crédits gratuits · 15 crédits par vectorisation IA |

## 🚀 Démarrage rapide

### 1 · Installer les dépendances

```bash
npm install
```

### 2 · Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` :

| Variable | Requis | Description |
|---|---|---|
| `VECTORIZER_API_ID` | Mode IA uniquement | Identifiant de l'API de vectorisation |
| `VECTORIZER_API_SECRET` | Mode IA uniquement | Secret de l'API de vectorisation |
| `NEXT_PUBLIC_SUPABASE_URL` | Non | Persistance des crédits côté serveur |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Non | Clé Supabase anon |

> Sans les clés API, seul le **mode Rapide** (local, gratuit) est disponible.
> Sans Supabase, les crédits sont suivis en mémoire Node.js (réinitialisés au redémarrage).

### 3 · Lancer le serveur

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

> **WSL2** Le navigateur Windows accède au serveur via l'IP WSL2 : `http://172.x.x.x:3000`

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, webpack) |
| UI | React 19, Tailwind CSS v4 |
| Vectorisation locale | imagetracerjs |
| Vectorisation IA | API externe (Basic Auth) |
| État | Zustand v5 |
| Persistance crédits | Supabase (optionnel) |

## 📁 Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Point d'entrée
│   ├── globals.css           # Thème sombre/clair (CSS vars), .btn-accent, .checker
│   ├── layout.tsx            # Layout racine & metadata
│   └── api/vectorize/
│       └── route.ts          # POST /api/vectorize — proxy API de vectorisation
├── components/
│   └── VectorizerApp.tsx     # Composant principal (toute l'UI)
├── lib/
│   ├── session.ts            # ID de session anonyme (localStorage)
│   └── serverCredits.ts      # Validation & décompte crédits côté serveur
├── store/
│   └── creditsStore.ts       # État Zustand des crédits client
└── types/
    └── imagetracerjs.d.ts    # Types pour imagetracerjs
```

## ⚙️ Comment ça fonctionne

**Mode Rapide**

1. L'utilisateur dépose une image et clique sur "Vectoriser"
2. `imagetracerjs` traite l'image entièrement dans le navigateur
3. Le SVG est généré instantanément — aucune donnée ne quitte l'appareil

**Mode IA**

1. L'image est envoyée à `POST /api/vectorize` avec un `sessionId`
2. La route vérifie les crédits disponibles (Supabase ou mémoire)
3. L'image est transmise à l'API externe avec authentification Basic Auth
4. Le SVG est retourné au client et les crédits sont débités
