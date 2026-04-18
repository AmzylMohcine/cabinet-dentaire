# 🦷 DentaCare - Application Desktop

## Gestion de Cabinet Dentaire - Dr. EL KTAM MAROINE

---

## 📋 Prérequis

- **Node.js** (v18 ou supérieur) → https://nodejs.org
- **Windows 10/11**
- **Les 2 PC** sur le même réseau local

---

## 🚀 Installation (5 minutes)

### Étape 1 : Installer les dépendances

Ouvrez un terminal (CMD ou PowerShell) dans le dossier `dentacare-desktop` :

```bash
cd dentacare-desktop
npm install
```

> ⚠️ Si `better-sqlite3` échoue, exécutez :
> ```bash
> npm install --build-from-source
> ```

### Étape 2 : Lancer en mode développement

```bash
npm run dev
```

L'application s'ouvre automatiquement.

### Étape 3 : Créer le .exe installable

```bash
npm run build
```

Le fichier `.exe` sera dans le dossier `dist/`.

---

## 🌐 Configuration Réseau (2 PC)

### Sur le PC principal (celui du Docteur) :

1. **Créer un dossier partagé** sur le réseau :
   - Créez un dossier, par exemple : `C:\DentaCare-Data`
   - Clic droit → Propriétés → Partage → Partager
   - Donnez accès en **Lecture/Écriture** aux utilisateurs du réseau
   - Notez le chemin réseau : `\\NOM-DU-PC\DentaCare-Data`

2. **Dans l'application** :
   - Allez dans les paramètres (si disponible) ou au premier lancement
   - L'app vous demandera où stocker la base de données
   - Choisissez `C:\DentaCare-Data`

### Sur le PC de l'Assistante :

1. **Installez le .exe** (même fichier que le Docteur)
2. **Dans l'application** :
   - Choisissez le dossier réseau : `\\NOM-DU-PC-DOCTEUR\DentaCare-Data`
   - Les deux PC partagent maintenant la même base de données !

---

## 📁 Structure du Projet

```
dentacare-desktop/
├── main.js           # Process principal Electron
├── preload.js        # Bridge sécurisé Electron ↔ React
├── database.js       # Gestion SQLite (CRUD complet)
├── package.json      # Dépendances & scripts
├── vite.config.js    # Config build React
├── index.html        # Point d'entrée HTML
├── src/
│   ├── main.jsx      # Entrée React
│   └── App.jsx       # Application complète
├── public/
│   └── ordonnance-bg.jpg  # En-tête ordonnance
└── dist/             # Fichier .exe (après build)
```

---

## 🗃️ Base de Données

La base SQLite contient les tables :

| Table | Description |
|-------|------------|
| `patients` | Infos patient, allergies, antécédents |
| `appointments` | Rendez-vous avec statut |
| `invoices` | Factures et paiements |
| `prescriptions` | Ordonnances avec médicaments |
| `devis` | Devis pour mutuelles |
| `dental_chart` | Schéma dentaire par patient |
| `treatments` | Traitements réalisés |

### Mode WAL activé
La base utilise le mode **WAL** (Write-Ahead Logging) qui permet à plusieurs PC de lire/écrire simultanément sans conflit.

---

## 🔧 Dépannage

### "better-sqlite3 ne s'installe pas"
```bash
npm install windows-build-tools -g
npm install better-sqlite3 --build-from-source
```

### "L'assistante ne voit pas la base"
- Vérifiez que le dossier partagé est accessible : `\\NOM-PC\DentaCare-Data`
- Assurez-vous que le pare-feu autorise le partage de fichiers
- Les deux PC doivent être sur le même groupe de travail

### "Erreur SQLITE_BUSY"
- Normal si les 2 PC écrivent en même temps (rare)
- Le mode WAL + busy_timeout gère ça automatiquement
- Si ça persiste, augmentez `busy_timeout` dans `database.js`

---

## 📝 Fonctionnalités

- ✅ Gestion patients (ajout, modification, recherche)
- ✅ Schéma dentaire interactif
- ✅ Rendez-vous avec workflow Assistante → Salle → Docteur
- ✅ Facturation avec paiements partiels
- ✅ Envoi facture Docteur → Assistante pour impression
- ✅ Ordonnances avec modèles et détection allergies
- ✅ Devis pour mutuelles
- ✅ Impression avec en-tête Dr. EL KTAM MAROINE
- ✅ Rôles Docteur / Assistante avec permissions
- ✅ Base de données partagée en réseau local

---

## 🖨️ Impression

Dans la version Electron, le bouton **Imprimer** ouvre directement la boîte de dialogue d'impression Windows.
L'en-tête avec vos coordonnées (Dr. EL KTAM MAROINE) est intégré automatiquement.

---

*DentaCare v1.0 - Cabinet Dentaire Dr. EL KTAM MAROINE - Tanger*
# cabinet-ktam
