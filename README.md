# Gestionnaire de Doublons

![Aperçu](./images/icon.png)

## Description

**Gestionnaire de Doublons** est une application web permettant d’analyser et de supprimer facilement les doublons présents dans vos fichiers texte, CSV, Excel, Word ou SQL. L’interface intuitive propose un aperçu des doublons détectés, des statistiques, et permet de télécharger un fichier nettoyé.

## Fonctionnalités

- Glisser-déposer ou sélection de fichier
- Prise en charge des formats : **TXT**, **CSV**, **XLSX/XLS (Excel)**, **DOCX (Word)**, **SQL**
- Détection automatique des doublons
- Statistiques détaillées (total, uniques, groupes de doublons, etc.)
- Validation/annulation des doublons individuellement ou en masse
- Suppression des doublons validés
- Téléchargement du fichier nettoyé
- Aperçu du résultat nettoyé

## Installation

1. Clonez ou téléchargez ce dépôt.
2. Ouvrez `index.html` dans votre navigateur.

Aucune installation supplémentaire n’est requise (tout fonctionne côté client).

## Utilisation

1. Ouvrez l’application dans votre navigateur.
2. Glissez-déposez un fichier ou cliquez sur **Sélectionner un fichier**.
3. Consultez les statistiques et la liste des doublons détectés.
4. Validez ou annulez les doublons selon vos besoins.
5. Supprimez les doublons validés ou téléchargez le fichier nettoyé.

## Dépendances

- [XLSX.js](https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js) (lecture Excel)
- [PapaParse](https://cdnjs.cloudflare.com/ajax/libs/papaparse/5.3.2/papaparse.min.js) (lecture CSV)
- [Mammoth.js](https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js) (lecture Word)

Ces dépendances sont chargées via CDN dans [index.html](index.html).

## Structure du projet

- `index.html` — Interface principale de l’application
- `script.js` — Logique JavaScript de gestion des fichiers et doublons
- `style.css` — Styles de l’interface
- `images/icon.png` — Icône de l’application

---

*Ce projet fonctionne entièrement côté client, aucune donnée n’est envoyée sur un serveur.*