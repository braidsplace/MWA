#!/usr/bin/env python3
"""Build the public, form-free preview for GitHub Pages."""

from hashlib import sha256
from pathlib import Path
from shutil import copy2, copytree, ignore_patterns, rmtree

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "pages" / "dist"
FILM_NAME = "made-with-africa-presentation-final-1080p.mp4"
FILM_SHA256 = "bfd6be69d10bdd2e4d3b10254f66d61b1f7b1376b83e00f09f5cd4e57fd49532"


def holding_page(title: str, message: str, image: str, alt: str) -> str:
    return f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} — Sisi in Africa</title>
  <link rel="icon" href="assets/logo.svg" type="image/svg+xml">
  <style>
    *{{box-sizing:border-box}}body{{margin:0;background:#421f21;color:#f5efe7;font-family:Cochin,Georgia,serif}}
    header{{padding:28px clamp(22px,5vw,70px);position:absolute;z-index:2;width:100%}}
    .brand{{font:bold 38px Arial,sans-serif;letter-spacing:-.12em;color:#f5efe7;text-decoration:none}}
    .brand span{{color:#d9ad91}}main{{min-height:100svh;display:grid;grid-template-columns:1fr 1fr}}
    .copy{{padding:150px clamp(28px,7vw,110px) 70px;display:flex;flex-direction:column;justify-content:center}}
    .kicker{{font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#e2c4b2}}
    h1{{font:bold clamp(42px,5vw,82px)/1.02 Georgia,serif;margin:24px 0;max-width:740px}}
    p{{font-size:clamp(19px,1.6vw,25px);line-height:1.45;max-width:650px}}
    .actions{{display:flex;flex-wrap:wrap;gap:15px;margin-top:24px}}
    .actions a{{color:#421f21;background:#f5efe7;text-decoration:none;padding:17px 22px;font-weight:bold}}
    .actions a:last-child{{background:transparent;color:#f5efe7;border:1px solid #f5efe7a8}}
    .visual{{min-height:500px;display:flex;align-items:center;background:#5b302d}}
    .visual img{{width:100%;height:100%;object-fit:contain;display:block}}
    @media(max-width:800px){{main{{grid-template-columns:1fr}}.copy{{padding-top:130px;padding-bottom:40px}}.visual{{min-height:300px;max-height:55vh}}}}
  </style>
</head>
<body>
  <header><a class="brand" href="index.html" aria-label="Retour à l'accueil">MA<span>.</span></a></header>
  <main>
    <div class="copy"><span class="kicker">Sisi in Africa · Made With Africa</span><h1>{title}</h1><p>{message}</p>
      <div class="actions"><a href="mailto:direction@madewithafrica.fr?subject=Sisi%20in%20Africa">Nous écrire ↗</a><a href="index.html">Retour à l’accueil</a></div>
    </div>
    <div class="visual"><img src="assets/{image}" alt="{alt}"></div>
  </main>
</body>
</html>'''


if DIST.exists():
    rmtree(DIST)
DIST.mkdir(parents=True)

for suffix in ("*.html", "*.css"):
    for source in sorted(ROOT.glob(suffix)):
        if source.name in {"portail-ambassadrice.html", "connexion-ambassadrice.html"}:
            continue
        copy2(source, DIST / source.name)
        if source.suffix == ".html":
            published = DIST / source.name
            html = published.read_text(encoding="utf-8")
            html = html.replace('<div class="concept-note">Proposition de direction artistique · aperçu non publié</div>', "")
            html = html.replace('<small>PROPOSITION DE DIRECTION ARTISTIQUE · NON PUBLIÉE</small>', "")
            html = html.replace('<small>PROPOSITION DE DIRECTION ARTISTIQUE · NON PUBLIÉE · PROGRAMME INDICATIF</small>', "")
            published.write_text(html, encoding="utf-8")
copy2(ROOT / "script.js", DIST / "script.js")
copytree(
    ROOT / "assets", DIST / "assets",
    ignore=ignore_patterns(
        "video-parts",
        "made-with-africa-presentation-1080p.mp4",
        "made-with-africa-presentation-720p.mp4",
        "ambassadrice-auth.bundle.js",
        "ambassadrice-portal.bundle.js",
    ),
)

film = DIST / "assets" / FILM_NAME
if not film.exists():
    parts = sorted((ROOT / "assets" / "video-parts").glob(f"{FILM_NAME}.part-*"))
    if len(parts) != 5:
        raise RuntimeError("La vidéo de présentation est incomplète.")
    with film.open("wb") as output:
        for part in parts:
            with part.open("rb") as source:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
if sha256(film.read_bytes()).hexdigest() != FILM_SHA256:
    raise RuntimeError("La vidéo de présentation est incomplète.")

(DIST / "candidature.html").write_text(holding_page(
    "Les voyages arrivent bientôt.",
    "Les inscriptions en ligne ne sont pas encore ouvertes. Écris-nous si tu souhaites être informée ou poser une question sur un voyage.",
    "sisi-original.png", "Illustration des trois Sisi",
), encoding="utf-8")
(DIST / "ambassadrice.html").write_text(holding_page(
    "L’espace ambassadrice arrive bientôt.",
    "L’accès personnel et les recommandations seront disponibles prochainement. Tu peux déjà nous écrire pour en savoir plus.",
    "sisi-travail.png", "Les trois Sisi travaillent ensemble",
), encoding="utf-8")
(DIST / ".nojekyll").touch()
print(f"Version GitHub Pages prête : {DIST}")
