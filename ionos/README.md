# Paquet pour Hébergement Web IONOS

Ce dossier prépare le site pour **Hébergement Web IONOS** (PHP 8.1 ou plus). Il ne sert pas à MyWebsite Now Plus. Le domaine final reste `www.madewithafrica.fr`.

## Construction

Exécuter `python3 ionos/build.py` depuis la racine du projet. L'archive `ionos/dist/sisi-in-africa-ionos.zip` contient :

- `public/` : pages, images, styles et route `/api/candidatures` ;
- `private/` : code serveur, hors du dossier visible sur le Web.

Le paquet ne contient ni clé Notion ni données de candidatures. **Ne jamais mettre `private/` dans le dossier exposé par le domaine.**

## Installation après création de l'hébergement

1. Charger le dossier `sisi-in-africa` dans l'espace Web par SFTP ou WebTransfert. Définir le répertoire cible du domaine ou sous-domaine de test sur `sisi-in-africa/public`, et non sur `sisi-in-africa`.
2. Dans `sisi-in-africa/private`, copier `config.example.php` en `config.php`. Renseigner le jeton de la connexion interne Notion directement sur le serveur, sans l'envoyer dans un chat ni l'ajouter à l'archive. L'accès Notion doit être limité à la base **SISI IN AFRICA — CANDIDATURES**. Le dossier `private/state` sera créé automatiquement par PHP ; il doit être accessible en écriture par PHP.
3. Choisir PHP 8.1 ou plus et vérifier la disponibilité de l'extension cURL sur l'hébergement.
4. Tester l'adresse de prévisualisation en HTTPS. La route `POST /api/candidatures` ne doit renvoyer un succès qu'après présence de la fiche dans Notion. Tester les trois qualifications fictives et un nouvel envoi avec la même référence.
5. Lorsque l'aperçu est validé, connecter `www.madewithafrica.fr` puis le domaine racine au dossier `public` chez IONOS. Vérifier les enregistrements de messagerie avant et après : ne pas modifier les MX IONOS.

Si un envoi vers Notion a un résultat incertain (par exemple délai réseau), la route **ne crée pas automatiquement une deuxième fiche** avec la même référence. Elle recherche d'abord la fiche dans Notion ; si elle est introuvable, l'envoi reste à examiner. La cliente conserve ses réponses sur la page.

Ce paquet n'est pas encore déployé. La connexion Notion et le parcours complet doivent être vérifiés sur le futur hébergement avant le basculement du domaine.
