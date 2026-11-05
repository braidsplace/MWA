"""Generate the static destination programme pages from the editable trip data below."""

from html import escape
from pathlib import Path
from urllib.parse import quote


TRIPS = [
    {
        "slug": "johannesburg",
        "title": "Johannesburg.",
        "country": "Afrique du Sud",
        "theme": "Ville · Safari · Rencontres",
        "image": "jozi.webp",
        "alt": "Rue et architecture du centre de Johannesburg",
        "duration": "8 jours · 7 nuits, indicatif",
        "dates": "12 — 19 mars 2027, dates fictives",
        "lead": "Une ville surprenante, des femmes inspirantes et une parenthèse safari.",
        "intro": "Les Sisis du monde se rejoignent à l’aéroport de Johannesburg. Un transfert de groupe nous conduit à l’hôtel ; on s’installe, puis on partage un cocktail ou un apéritif de bienvenue pour faire connaissance.",
        "note": "Le rythme exact, les intervenantes, les lieux et le safari seront confirmés dans le programme final.",
        "stages": [('01 / Se retrouver',
  'Les Sisis se rejoignent',
  'Rendez-vous au point de rencontre de l’aéroport, même si nous arrivons de pays différents.',
  'Aéroport'),
 ('02 / Prendre ses marques',
  'Bienvenue à Johannesburg',
  'Transfert de groupe, installation à l’hôtel et cocktail ou apéritif d’accueil.',
  'Accueil'),
 ('03 / Découvrir',
  'La ville qui surprend',
  'Explorer ses quartiers, ses scènes créatives et ses bonnes adresses.',
  'Ville'),
 ('04 / Rencontrer',
  'Des femmes qui inspirent',
  'Partager un talk avec des femmes dont les parcours donnent des idées pour la suite.',
  'Rencontres'),
 ('05 / Se reconnecter',
  'Un temps pour toi',
  'Atelier autour de tes objectifs, de tes envies et de ce que tu aspires à créer.',
  'Atelier'),
 ('06 / Changer de rythme',
  'La parenthèse safari',
  'Découverte de la nature et observation des animaux selon l’itinéraire confirmé.',
  'Safari envisagé'),
 ('07 / Profiter',
  'Lifestyle et soirées',
  'Shopping, culture, beauté ou spa selon le programme, avec trois soirées partagées.',
  '3 soirées'),
 ('08 / Repartir',
  'Les étoiles plein les yeux',
  'Cercle de clôture, derniers instants ensemble puis transfert vers l’aéroport.',
  'Retour')],
    },
    {
        "slug": "cape-town",
        "title": "Cape Town.",
        "country": "Afrique du Sud",
        "theme": "Spécial jazz festival",
        "image": "cape-jazz.jpg",
        "alt": "Chanteuse de jazz et saxophoniste sur scène, visuel d’ambiance",
        "duration": "8 jours · 7 nuits, indicatif",
        "dates": "20 — 27 mars 2027, dates fictives",
        "lead": "Découvrir Cape Town au rythme de la musique, des rencontres et de la ville.",
        "intro": "Les Sisis se retrouvent à l’aéroport de Cape Town. Après le transfert et l’installation à l’hôtel, un apéritif d’accueil ouvre le voyage et les premières conversations.",
        "note": "La participation au Cape Town International Jazz Festival dépendra de ses dates et de sa programmation officielles. Aucun concert précis n’est encore confirmé.",
        "stages": [('01 / Se retrouver',
  'Les Sisis arrivent',
  'Rendez-vous à l’aéroport de Cape Town au point de rencontre convenu.',
  'Aéroport'),
 ('02 / Prendre ses marques',
  'L’accueil entre sœurs',
  'Transfert de groupe, installation à l’hôtel et apéritif de bienvenue.',
  'Accueil'),
 ('03 / Découvrir',
  'Cape Town à ciel ouvert',
  'Quartiers créatifs, paysages et bonnes adresses pour sentir l’énergie de la ville.',
  'Ville'),
 ('04 / Rencontrer',
  'Les voix de la ville',
  'Échanges avec des femmes inspirantes et découverte de leurs parcours.',
  'Rencontres'),
 ('05 / Se reconnecter',
  'Faire le point',
  'Un atelier pour réfléchir à tes envies et à ce que tu souhaites créer.',
  'Atelier'),
 ('06 / Vibrer',
  'Le jazz en partage',
  'Concerts du Cape Town International Jazz Festival envisagés selon sa programmation officielle.',
  'Festival à confirmer'),
 ('07 / Profiter',
  'Trois soirées, mille sons',
  'Trois soirées musicales, avec du temps pour les découvertes, les bonnes tables et le shopping.',
  '3 soirées'),
 ('08 / Repartir',
  'Ce qui reste avec nous',
  'Dernier cercle entre Sisis, puis transfert de groupe vers l’aéroport.',
  'Retour')],
    },
    {
        "slug": "tulear",
        "title": "Madagascar.",
        "country": "Madagascar · Tuléar",
        "theme": "Chez Lulu · Mer · Pirogue",
        "image": "tulear-ifaty.jpg",
        "alt": "Mer près de Tuléar et d’Ifaty à Madagascar, visuel d’ambiance",
        "duration": "10 jours · 9 nuits, indicatif",
        "dates": "05 — 14 juin 2027, dates fictives",
        "lead": "La mer, la pirogue et le plaisir de vivre Madagascar loin de la foule.",
        "intro": "Les Sisis se rejoignent à l’aéroport convenu pour rejoindre Tuléar et Chez Lulu. On pose ses valises, puis un apéritif d’accueil donne le ton : prendre le temps de se connaître et de ralentir.",
        "note": "Les trajets, sorties en mer, rencontres et conditions de navigation dépendront des partenaires et de la météo.",
        "stages": [('01 / Se retrouver',
  'Bienvenue à Madagascar',
  'Point de rencontre à l’aéroport convenu avant de rejoindre Tuléar.',
  'Aéroport'),
 ('02 / Prendre ses marques',
  'Chez Lulu',
  'Transfert, installation et apéritif d’accueil pour faire connaissance.',
  'Accueil'),
 ('03 / Découvrir',
  'La mer et la pirogue',
  'Sortie en mer envisagée selon les conditions locales et le programme confirmé.',
  'Mer'),
 ('04 / Rencontrer',
  'Des femmes du territoire',
  'Échanges et découvertes au fil des rencontres locales.',
  'Rencontres'),
 ('05 / Se reconnecter',
  'Ralentir pour mieux voir',
  'Atelier autour de tes aspirations et de tes prochains élans.',
  'Atelier'),
 ('06 / Explorer',
  'Tuléar loin de la foule',
  'Artisanat, vie locale et temps pour apprécier le lieu à son rythme.',
  'Découverte'),
 ('07 / Profiter',
  'Douceur et soirées',
  'Temps de plage, bien-être et trois soirées conviviales au fil du séjour.',
  '3 soirées'),
 ('08 / Repartir',
  'Garder l’essentiel',
  'Cercle de clôture, derniers instants au bord de l’eau et transfert vers l’aéroport.',
  'Retour')],
    },
    {
        "slug": "hoedspruit",
        "title": "Hoedspruit.",
        "country": "Afrique du Sud",
        "theme": "Ukuthula Bush Lodge · Bien-être",
        "image": "hoedspruit.webp",
        "alt": "Girafe dans le bush près de Hoedspruit, visuel d’ambiance",
        "duration": "10 jours · 9 nuits, indicatif",
        "dates": "03 — 12 septembre 2027, dates fictives",
        "lead": "Dix jours de déconnexion, de yoga et de nature au rythme du bush.",
        "intro": "Les Sisis se retrouvent à l’aéroport convenu avant de rejoindre Ukuthula Bush Lodge. Installation, apéritif d’accueil et première soirée calme : on laisse doucement le quotidien derrière soi.",
        "note": "Les séances de yoga, sorties nature et observations d’animaux seront précisées avec le lodge et les guides locaux.",
        "stages": [('01 / Se retrouver',
  'Arriver dans le bush',
  'Point de rencontre à l’aéroport convenu et début du transfert vers Hoedspruit.',
  'Aéroport'),
 ('02 / Prendre ses marques',
  'Ukuthula Bush Lodge',
  'Installation et apéritif d’accueil dans une ambiance calme.',
  'Accueil'),
 ('03 / Respirer',
  'Le corps ralentit',
  'Séances de yoga et temps libre envisagés pour entrer dans le rythme du séjour.',
  'Yoga'),
 ('04 / Découvrir',
  'La nature tout autour',
  'Sorties accompagnées et observation respectueuse des animaux selon le programme final.',
  'Animaux'),
 ('05 / Rencontrer',
  'Des voix inspirantes',
  'Échanges entre femmes et rencontres locales selon les intervenantes disponibles.',
  'Rencontres'),
 ('06 / Se reconnecter',
  'Un temps pour soi',
  'Atelier pour poser tes objectifs, tes envies et ce que tu veux créer.',
  'Atelier'),
 ('07 / Se ressourcer',
  'Le bien-être en liberté',
  'Yoga, détente et soirées douces remplacent ici les sorties animées.',
  'Bien-être'),
 ('08 / Repartir',
  'Plus légère',
  'Cercle de clôture, derniers moments au lodge et transfert vers l’aéroport.',
  'Retour')],
    },
    {
        "slug": "tanzanie",
        "title": "Tanzanie.",
        "country": "Tanzanie",
        "theme": "En cours de préparation",
        "image": "tanzania.webp",
        "alt": "Acacias dans la savane tanzanienne, visuel d’ambiance",
        "duration": "Durée à annoncer",
        "dates": "Dates à annoncer",
        "lead": "Une prochaine destination se prépare pour les Sisis.",
        "intro": "L’itinéraire tanzanien est encore en construction. L’esprit reste le même : se rejoindre, découvrir un pays entre femmes, prendre du temps pour soi et revenir inspirée.",
        "note": "Les lieux, la durée, les activités, l’hébergement et les prestations incluses ne sont pas encore arrêtés.",
        "stages": [('01 / Se retrouver',
  'Le point de départ',
  'Un rendez-vous à l’aéroport est envisagé pour réunir les Sisis du monde.',
  'À préciser'),
 ('02 / Prendre ses marques',
  'L’accueil',
  'Transfert de groupe, installation et apéritif de bienvenue sont à l’étude.',
  'À préciser'),
 ('03 / Découvrir',
  'Un pays à explorer',
  'L’itinéraire et les lieux de découverte seront choisis avec les partenaires locaux.',
  'À construire'),
 ('04 / Rencontrer',
  'Des femmes inspirantes',
  'Des échanges et talks sont envisagés au fil du voyage.',
  'À construire'),
 ('05 / Se reconnecter',
  'Un temps pour soi',
  'Un atelier laissera de la place à tes objectifs et à tes envies.',
  'À construire'),
 ('06 / Vivre le lieu',
  'Des expériences locales',
  'Nature, culture et activités seront adaptées à l’itinéraire retenu.',
  'À construire'),
 ('07 / Profiter',
  'Soirées ou bien-être',
  'Le rythme sera choisi selon la destination précise et le groupe.',
  'À construire'),
 ('08 / Repartir',
  'L’inspiration avec soi',
  'Un temps de clôture et un transfert vers l’aéroport concluront le voyage.',
  'À construire')],
    },
]


def e(value):
    return escape(value, quote=True)


def render_stages(trip):
    return "\n".join(
        f'''        <li><span class="program-stage-index">{e(moment)}</span><div><h3>{e(title)}</h3><p>{e(description)}</p></div><span class="program-stage-note">{e(note)}</span></li>'''
        for moment, title, description, note in trip["stages"]
    )


def render(trip):
    subject = quote(f"Programme Sisi - {trip['title'].rstrip('.')}")
    pending = trip["slug"] == "tanzanie"
    contact = (
        f"mailto:direction@madewithafrica.fr?subject={subject}"
        if pending else f"candidature.html?voyage={trip['slug']}"
    )
    application = f"candidature.html?voyage={trip['slug']}"
    inclusion_title = "Ce que nous souhaitons inclure." if pending else "Ce qui est prévu dans le voyage."
    inclusion_note = (
        "Cette liste est prévisionnelle pour la Tanzanie ; rien n’est encore ouvert à la réservation."
        if pending else
        "Le détail exact des prestations et des horaires sera transmis avec le programme définitif."
    )
    cta = "Être informée" if pending else "Je réserve ma place"
    hero_actions = (
        '<a class="button button-cream" href="#programme">Voir le programme <span aria-hidden="true">↗</span></a>'
        if pending else
        f'<div class="program-hero-actions"><a class="button button-cream" href="{e(contact)}">Je réserve ma place <span aria-hidden="true">↗</span></a><a class="text-link" href="#programme">Voir le programme <span aria-hidden="true">↓</span></a></div>'
    )
    return f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Programme indicatif Sisi in Africa à {e(trip['title'].rstrip('.'))} : rencontres, découvertes, temps pour soi et informations pratiques.">
  <title>{e(trip['title'].rstrip('.'))} — Programme Sisi in Africa</title>
  <link rel="icon" href="assets/logo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="styles.css?v=16">
  <link rel="stylesheet" href="programmes.css?v=7">
</head>
<body class="program-page">
  <div class="concept-note">Proposition de direction artistique · aperçu non publié</div>
  <header class="site-header">
    <a class="brand" href="index.html" aria-label="Sisi in Africa, accueil">MA<span class="brand-dot">.</span></a>
    <nav class="desktop-nav" aria-label="Navigation principale"><a href="index.html">Accueil</a><a href="index.html#voyages">Destinations</a><a href="#programme">Programme</a><a href="#infos">Informations</a></nav>
    <a class="header-cta" href="{e(contact)}">{e(cta)} <span aria-hidden="true">↗</span></a>
    <button class="menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span></button>
  </header>
  <nav id="mobile-nav" class="mobile-nav" aria-label="Navigation mobile" hidden><a href="index.html">Accueil</a><a href="index.html#voyages">Destinations</a><a href="#programme">Programme</a><a href="#infos">Informations</a><a href="{e(contact)}">{e(cta)} ↗</a></nav>

  <main>
    <section class="program-hero">
      <div class="program-hero-copy">
        <p class="eyebrow">Sisi in Africa · {e(trip['country'])}</p>
        <h1>{e(trip['title'])}</h1>
        <p>{e(trip['lead'])}</p>
        <div class="program-hero-meta"><span>{e(trip['duration'])}</span><span>{e(trip['dates'])}</span><span>Programme indicatif</span></div>
        {hero_actions}
      </div>
      <div class="program-hero-media"><img src="assets/{e(trip['image'])}" alt="{e(trip['alt'])}" fetchpriority="high"><small>{e(trip['theme'])}</small></div>
    </section>

    <section id="programme" class="program-timeline section-pad">
      <div class="section-topline"><span>Les huit étapes</span><span>UNE PREMIÈRE ESQUISSE</span></div>
      <div class="program-section-head"><h2>Le voyage,<br>étape après étape.</h2><p>Huit temps forts pour imaginer le séjour, quelle que soit sa durée. Leur ordre et leur contenu seront confirmés avant toute réservation.</p></div>
      <ol class="program-stages">
{render_stages(trip)}
      </ol>
      <div class="program-section-cta"><a class="button" href="{e(application)}">Je veux partir <span aria-hidden="true">↗</span></a></div>
    </section>

    <section id="infos" class="program-inclusions section-pad">
      <div class="section-topline"><span>Le séjour</span><span>EN TOUTE CLARTÉ</span></div>
      <h2>{e(inclusion_title)}</h2>
      <div class="program-inclusion-grid">
        <div><span>01</span><strong>L’hébergement pendant le séjour</strong></div>
        <div><span>02</span><strong>Les transferts et transports de groupe prévus</strong></div>
        <div><span>03</span><strong>Les activités et entrées du programme final</strong></div>
        <div><span>04</span><strong>Les petits déjeuners et l’apéritif d’accueil</strong></div>
      </div>
      <p>{e(inclusion_note)}</p>
      <div class="program-room"><h3>Ta chambre,<br>ton choix.</h3><p>La chambre partagée n’est jamais imposée. Elle peut aider à garder un tarif accessible si tu la choisis. Une option de chambre individuelle est prévue pour chaque voyage ; son supplément éventuel et sa disponibilité seront précisés avant inscription.</p></div>
      <div class="program-section-cta"><a class="button button-cream" href="{e(application)}">Je veux partir <span aria-hidden="true">↗</span></a></div>
    </section>

    <section class="program-confirm section-pad">
      <div class="section-topline"><span>Avant de réserver</span><span>LES DÉTAILS À FINALISER</span></div>
      <div class="program-confirm-grid"><h2>Ce qu’on te précisera avant de partir.</h2><div><ul><li>Le prix, les dates définitives et la taille du groupe.</li><li>Le lieu et l’heure du rendez-vous à l’aéroport, ainsi que les transferts.</li><li>Les repas au-delà des petits déjeuners et les activités facultatives.</li><li>Le tarif de la chambre individuelle et les conditions d’annulation.</li><li>Les vols, l’assurance voyage et les formalités à vérifier selon ton pays de départ.</li></ul><p>Ces éléments ne sont pas encore fixés dans cette maquette ; aucun prix ni prestation supplémentaire n’est promis ici.</p></div></div>
    </section>

    <section class="program-partners section-pad">
      <div class="section-topline"><span>Nos partenaires</span><span>LES PETITS PLUS DU VOYAGE</span></div>
      <h2>Voyager l’esprit plus libre.</h2>
      <p>Trois partenaires peuvent faciliter la préparation du séjour. Leurs services restent facultatifs et se choisissent selon tes besoins.</p>
      <div class="program-partner-grid">
        <article><span>Activités</span><h3>GetYourGuide</h3><p>Pour certaines expériences avec des prestataires soumis aux licences et autorisations requises. Chaque activité sera sélectionnée pour le voyage.</p><a href="https://www.getyourguide.fr/" target="_blank" rel="noopener noreferrer">Découvrir ↗</a></article>
        <article><span>Paiements</span><h3>Revolut</h3><p>Une solution pour payer et gérer les devises à l’étranger avec souplesse. Les frais et limites dépendent de ton abonnement et du moment du change.</p><a href="https://www.revolut.com/fr-FR/" target="_blank" rel="noopener noreferrer">Découvrir ↗</a></article>
        <article><span>Connexion</span><h3>Holafly</h3><p>Une eSIM pour rester connectée en voyage. Vérifie la couverture de la destination, le forfait et la compatibilité de ton téléphone.</p><a href="https://esim.holafly.com/fr/" target="_blank" rel="noopener noreferrer">Découvrir ↗</a></article>
      </div>
      <small>Les liens ouvrent les sites officiels. Les conditions, tarifs et avantages partenaires seront communiqués avec les informations définitives du voyage.</small>
    </section>

  </main>
  <footer class="footer"><p>Sisi in Africa · par Made With Africa</p><div class="footer-contact"><a href="mailto:direction@madewithafrica.fr">direction@madewithafrica.fr ↗</a></div><nav class="footer-social" aria-label="Réseaux sociaux"><a href="https://www.instagram.com/madewithafrica/" target="_blank" rel="noopener noreferrer">Instagram · Made With Africa ↗</a><a href="https://www.instagram.com/braidsplace/" target="_blank" rel="noopener noreferrer">Instagram · Braidsplace ↗</a><a href="https://www.tiktok.com/@madewithafricatravel" target="_blank" rel="noopener noreferrer">TikTok · Made With Africa ↗</a><a href="https://www.tiktok.com/@flowbraidsplace" target="_blank" rel="noopener noreferrer">TikTok · Braidsplace ↗</a></nav><nav class="footer-links" aria-label="Informations légales"><a href="confidentialite.html">Confidentialité</a><a href="cgv.html">CGV</a></nav><small>PROPOSITION DE DIRECTION ARTISTIQUE · NON PUBLIÉE · PROGRAMME INDICATIF</small></footer>
  <script src="script.js?v=2"></script>
</body>
</html>
'''


if __name__ == "__main__":
    folder = Path(__file__).parent
    for trip in TRIPS:
        path = folder / f"programme-{trip['slug']}.html"
        path.write_text(render(trip), encoding="utf-8")
        print(path.name)
