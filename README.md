# ESICAD NurseCare Server

Ce projet TypeScript a pour but d'être utilisé par le BTS SIO de l'ESICAD sur le projet NurseCare.

Il va utiliser l'API Google Maps 🗺 pour calculer l'ordonnancement d'une tournée d'adresses et renvoyer l'ordre optimal de passage de la tournée.

---

_Avertissement : étant donné que l'API Google Maps nécessite l'usage d'une clé d'API (qui ne s'obtient que lorsqu'on créé un compte et que l'on renseigne une carte de crédit. Ainsi, si vous ne souhaitez pas utiliser cette API, ne renseignez pas le paramètre_ `GOOGLE_MAP_API_KEY` _dans le fichier_ `.env`, _et cela utilisera le **mock mode** qui définit un ordre d'adresse de manière aléatoire._

---

## Scripts NPM

### Build

La commande `npm run build` permet de transformer le code TypeScript en JavaScript exécutable dans le dossier `dist`.

### Start

La commande `npm run start` va appeler le script de build puis lancer le fichier `dist/index.js`.

Un exemple d'appel à la fonction `computeRoute` peut être trouvé dans `index.ts`.

---

Auteur : Aurélien VERNAY (2023)
