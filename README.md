# NodeApp - Projet IUT Hapi.js 

Bienvenue sur le projet d'API RESTful **NodeApp**, développé avec le framework [Hapi.js](https://hapi.dev/). Cette application offre un moteur métier complet pour la gestion d'une base de données de films, l'authentification des utilisateurs, la gestion de listes de films favoris, ainsi qu'un système d'export asynchrone orchestré par RabbitMQ et notifié par courrier électronique (e-mail).

## Fonctionnalités Principales

- **Authentification & Autorisation :** Sécurisation robuste des routes via JWT (JSON Web Tokens). Gestion intégrée des rôles par `scope` (`user`, `admin`).
- **Gestion des Utilisateurs :** Inscription ouverte, connexion, mise à jour de profil, suppression et consultation de l'annuaire des utilisateurs.
- **Gestion des Films :** Ajout, modification et suppression de films (actions réservées aux administrateurs). Consultation publique et pour les utilisateurs connectés.
- **Système de Favoris :** Chaque utilisateur peut ajouter ou retirer des films de sa collection personnelle de favoris.
- **Notifications par E-mail :** Système paramétrable d'envoi de courriels (ex: SMTP classique ou Ethereal pour le débuggage) :
  - L'inscription d'un nouvel utilisateur déclenche un e-mail de bienvenue.
  - L'ajout d'un nouveau film dans le système alerte l'ensemble des utilisateurs inscrits.
  - La mise à jour d'un film n'alerte que les utilisateurs l'ayant ajouté à leurs favoris.
- **Export Asynchrone (RabbitMQ) :** Possibilité pour les administrateurs de faire une demande d'export CSV global. La tâche est poussée dans une file d'attente RabbitMQ et traitée en arrière-plan (`AmqpService`). Une fois le fichier CSV généré, il est envoyé par e-mail en pièce jointe à l'administrateur demandeur (`MailService`).
- **Qualité de Code Maximisée :** L'application est couverte par une suite de **tests unitaires et fonctionnels** rigoureusement codés sous `@hapi/lab` et `@hapi/code`, frôlant le 100% de `code coverage`.

##  Pré-requis d'Installation

Avant de lancer le projet, assurez-vous d'avoir les éléments suivants disponibles sur votre système hôte :
- **Node.js** (v14+ recommandé)
- **NPM**
- **Serveur RabbitMQ** (Il doit tourner localement sur le port amqp par défaut `5672` ou posséder une URI accessible).

##  Variables d'Environnement (.env)

L'application repose sur des variables d'environnement cruciales pour paramétrer le comportement de son serveur, de sa base de données, du transporteur d'e-mail, et du broker de messagerie.

Créez un fichier `.env` à la racine de votre dossier `server/` (et/ou à la racine du projet, cela dépend d'où vous lancez l'application) avec les variables suivantes :

```env
# Configuration Globale
PORT=3000
NODE_ENV=development # Basculez sur 'production' pour lier une base de données MySQL persistante

# Configuration Serveur de Base de Données (Optionnel en développement)
# -> Note: En NODE_ENV=development, SQLite in-memory est utilisé.
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=hapi
DB_DATABASE=user
DB_PORT=3306

# SMTP Credentials - Transport e-mail (Ex: Ethereal.email)
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_USER=votre_utilisateur_ethereal
MAIL_PASS=votre_mot_de_passe_ethereal

# URI RabbitMQ 
RABBITMQ_URL=amqp://localhost
```

>  **Information Debug E-mail :** Si aucun transporteur valide n'est utilisé, laissez les informations `ethereal.email` par défaut. L'application print dans les logs de la console les liens URL de visualisation pour chaque e-mail envoyé virtuellement ! Très pratique pour valider le comportement sans polluer une vraie boîte mail.

##  Lancement et Déploiement

### Étape 1 : Installation

Après un `git clone` du socle de l'application, installez l'arbre des dépendances via NPM :

```bash
npm install
```

### Étape 2 : Exécution de l'Application

```bash
npm start
```
*Le serveur démarrera dynamiquement en écoutant les configurations du manifest.*

#### Quid des Migrations de Base de données ?

- **En mode Développement (`NODE_ENV` non défini ou `=development`) :**
  L'application démarre automatiquement sur un driver de base de données SQLite in-memory rapide et volatile. **Toutes les migrations (créations des tables SQL) sont exécutées toutes seules, de manière transparente et scriptée, au démarrage du projet !**
- **En mode Production (`NODE_ENV=production`) :**
  Le driver passe sur la configuration standard (MySQL). Vous devrez appliquer de votre côté les migrations Schwifty sur la DB attachée.

### Étape 3 : Interagir avec l'API

L'application expose une collection OpenAPI dynamique nativement intégrée. Accédez à l'URL locale suivante dans votre navigateur favori pour visualiser toutes les routes de l'application, les payloads Joi attendus et tester vos appels via Swagger :

`http://localhost:3000/documentation`

*(PS: N'oubliez pas d'y insérer votre token JWT généré suite au Login dans le bouton 'Authorize' en haut de page)*

## Tests Unitaires et Linter

Le projet est livré avec une suite de tests poussée. Vous trouverez le répertoire logique et isolé des tests métiers dans le dossier `/test/`. Voici les commandes indispensables pour l'intégration continue (CI) :

- Lancer toute la suite isolée de Tests Unitaires : `npm run test`
- Vérifier la couverture de code globale de l'application (Code Coverage) : `npm run test-cov`
- Lancer le Linter (ESLint) : `npm run lint`

## Architecture du Code (Map)

Le projet respecte à la lettre les préceptes orientés plugin et le design-pattern MVC promus par Hapi.js `@hapipal` :
- `lib/models/` : Couche d'accès aux entités Data (Schwifty, formattées en Objection.js).
- `lib/routes/` : Points d'entrée Endpoints. Configuration Joi et vérifications du scope JWT `auth` requises.
- `lib/services/` : Core logique et applicatif `Schmervice`. (`UserService`, `MovieService`, `FavoriteService`, `MailService` et `AmqpService`).
- `lib/migrations/` : Scripts des états incrémentaux de la structure de base de données relationnelle.
- `lib/auth/` : Stratégies et validateur JWT de connexion.
- `server/` : Manifest configuration principal orientée "Confidence Store".
- `test/` : Définition des Test Cases lab.
