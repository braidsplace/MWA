# Mise en ligne de Sisi in Africa

## État actuel

- Le site et le formulaire sont prêts en aperçu local : `http://127.0.0.1:8766/candidature.html`.
- La base Notion **SISI IN AFRICA — CANDIDATURES** existe dans **MADE WITH AFRICA — Direction**. Les vues PRIORITÉS, À RAPPELER, PROJETS FUTURS et TOUTES LES CANDIDATURES sont créées. Les vues **À VALIDER · AMBASSADRICES** et **PROPOSITIONS AMBASSADRICES** ont été ajoutées sans toucher aux candidatures existantes.
- Une candidature **TEST — Candidature fictive Sisi** a été vérifiée dans les vues PRIORITÉS et À RAPPELER.
- La route `POST /api/candidatures` valide les données, recherche la référence de soumission avant création et répond « succès » uniquement après écriture dans Notion.
- La clé de l'intégration officielle Notion n'est pas encore configurée. Le formulaire public ne peut pas enregistrer de vraies candidatures avant cette étape.
- Le domaine `madewithafrica.fr` pointe encore vers le site Canva. Les enregistrements MX de la messagerie IONOS doivent être conservés.

## Connexion Notion

1. Dans l'espace Made With Africa, créer une **connexion interne officielle Notion** nommée par exemple « Site Sisi in Africa ».
2. Accorder **Read content**, **Insert content** et **Update content**. La mise à jour sert à inscrire les groupes de six après validation des recommandations. Aucun accès aux commentaires ou utilisateurs n'est nécessaire.
3. Donner à cette connexion accès à la base **SISI IN AFRICA — CANDIDATURES**. La liste **SISI IN AFRICA — DEMANDES AMBASSADRICES** existe également, mais la page Ambassadrice ne collecte plus de demandes de présentation du programme.
4. Ajouter le secret côté hébergeur sous le nom `NOTION_API_KEY`. Ne jamais l'inscrire dans un fichier du site, un email, une capture ou le code navigateur.
5. L'identifiant de la source Notion est `a0bb33cf-eced-481e-bb0d-a3a83f70364e`. Il peut être défini dans `NOTION_DATA_SOURCE_ID` ; le serveur contient déjà cette valeur publique comme valeur par défaut.
6. L'ancienne source des demandes ambassadrices est `eb6987a4-1288-4580-b448-348d5c657ba2`. Elle est conservée sans supprimer les données existantes.

## Hébergement

Le compte IONOS montré le 3 novembre 2026 contient un **Pack Domaine** et **MyWebsite Now Plus**, ainsi que les domaines supplémentaires. Il n'affiche pas de contrat **Hébergement Web**. MyWebsite Now Plus est un éditeur de site sans accès FTP et ne permet donc pas de publier directement les fichiers de ce projet ni sa route serveur Notion.

**Point à vérifier avant de choisir IONOS comme hébergeur du nouveau site :** `madewithafrica.fr` est rattaché au contrat MyWebsite Now Plus. IONOS indique qu'un déplacement du domaine vers un autre contrat peut supprimer les adresses email liées au domaine. Ne pas entreprendre ce déplacement sans plan de sauvegarde et de continuité pour la messagerie. Une solution qui laisse le domaine dans son contrat actuel et ne change que les réglages Web du domaine évite cette opération.

Le domaine peut rester administré chez IONOS. Pour publier le projet, il faut un hébergement distinct capable de servir les fichiers et la route sécurisée. Deux pistes :

- **Hébergement Web IONOS** : un paquet de déploiement est préparé dans `ionos/dist/sisi-in-africa-ionos.zip`. Il contient les pages et une adaptation PHP de la route Notion. Le secret doit être placé dans `private/config.php`, hors du répertoire public. Cette adaptation devra être testée sur le futur hébergement avant toute candidature réelle.
- **Netlify** : les fichiers `netlify.toml`, `netlify/build.py` et `netlify/functions/candidatures.mjs` préparent un aperçu avec l'API Notion, sans déplacer le domaine ni les emails. Le compte et l'adresse d'aperçu restent à créer ; aucune mise en ligne n'a été effectuée.

Choisir l'hébergement avant tout achat ou changement DNS. Ne pas utiliser le forfait gratuit Hobby de Vercel pour ce site commercial : ce forfait est réservé aux usages personnels non commerciaux.

Pour les premiers essais, privilégier un hébergement qui accepte le site et la route serveur sans déplacer `madewithafrica.fr` de son contrat IONOS actuel. Vérifier l'offre choisie pour un usage professionnel et préparer l'adresse de test avant de modifier les réglages du domaine.

Voir `ionos/README.md` pour la structure du paquet et les contrôles de déploiement.

Ne pas remplacer les enregistrements MX ou autres réglages email lors du basculement. Tester d'abord le site et la route sur une adresse de prévisualisation propre à l'hébergeur ; ensuite seulement mettre à jour `@` et `www`.

## Contenu à vérifier avant publication

- [x] Intégrer la vidéo de présentation de Made With Africa sur l'accueil. La version locale a été étalonnée avec douceur, légèrement accentuée et convertie en 1080p/720p ; l'original est conservé.
- [ ] Choisir la diffusion de la vidéo pour le site public. Les fichiers de 110 Mo et 30 Mo sont adaptés à l'aperçu local, mais Netlify indique que les fichiers de plus de 10 Mo peuvent faire échouer un déploiement. Prévoir une solution vidéo dédiée avant d'y mettre en ligne le site, sans réduire la qualité de force.
- [ ] Télécharger les vidéos sur cet ordinateur depuis le stockage cloud avant de relancer la préparation des paquets. Leur lecture locale est actuellement en attente et les dossiers de déploiement ont été marqués incomplets.
- [ ] Vérifier l'affichage et la lecture sur un téléphone réel.
- [ ] Finaliser les CGV avant l'ouverture de réservations fermes : prix et prestations de chaque séjour, conditions de paiement et d'annulation, assurances, informations précontractuelles, coordonnées légales et médiateur de la consommation. La page `cgv.html` est pour le moment un brouillon d'information, clairement signalé comme tel.
- [ ] Faire vérifier le cadre réglementaire des séjours organisés et, si nécessaire, l'immatriculation Atout France, la garantie financière et l'assurance responsabilité civile professionnelle avant la vente.

## Test du parcours cliente avant basculement DNS

1. Ouvrir l'adresse de prévisualisation sur ordinateur et téléphone.
2. Parcourir les cinq étapes. Vérifier les choix multiples, les trois réponses de qualification, les champs conditionnels, la validation et le récapitulatif.
3. Envoyer trois candidatures fictives, une pour chaque qualification. Vérifier dans Notion : les coordonnées et réponses, la date, les vues, la priorité, l'action de rappel et le statut commercial « Nouveau ».
4. Réessayer une soumission avec la même référence après une coupure simulée. Confirmer qu'une seule fiche existe.
5. Vérifier la page de confidentialité, le consentement marketing décoché et l'absence d'informations personnelles dans les journaux publics.
6. Une fois l'aperçu et les tests validés, remplacer uniquement les enregistrements DNS nécessaires au site Web, puis refaire un test sur `https://www.madewithafrica.fr`.

La page **Ambassadrice** présente uniquement la connexion et le pied de page. L'aperçu local permet de voir le parcours, mais l'authentification réelle doit être testée sur l'aperçu Netlify après configuration d'Identity.

L'espace personnel des ambassadrices utilise **Netlify Identity** en accès sur invitation. Activer Identity sur le futur site Netlify, choisir « invite only », inviter les ambassadrices et leur attribuer le rôle `ambassadrice`. Les emails de réinitialisation sont envoyés à l'ambassadrice. Les recommandations sont filtrées côté serveur par son identifiant ; Florence les valide dans Notion. Une synchronisation automatique vérifie toutes les dix minutes si six Sisis validées ont la même destination et la même période pour former un groupe. Tester la connexion, l'email de réinitialisation, le filtrage des comptes et la synchronisation sur un aperçu Netlify avant de recevoir de vraies données.
