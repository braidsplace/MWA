#!/usr/bin/env python3
"""Copy only public site files into the Netlify publish directory."""

from hashlib import sha256
from pathlib import Path
from shutil import copy2, copytree, ignore_patterns, rmtree

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "netlify" / "dist"

if DIST.exists():
    rmtree(DIST)
DIST.mkdir(parents=True)

for suffix in ("*.html", "*.css"):
    for source in sorted(ROOT.glob(suffix)):
        copy2(source, DIST / source.name)
for name in ("script.js", "candidature.js", "ambassadrice-interet.js"):
    copy2(ROOT / name, DIST / name)
copytree(
    ROOT / "assets",
    DIST / "assets",
    ignore=ignore_patterns(
        "video-parts",
        "made-with-africa-presentation-1080p.mp4",
        "made-with-africa-presentation-720p.mp4",
    ),
)

# The 1080p film is kept in smaller parts for the GitHub connection.
# Reassemble it only in the publication folder; the original local film is untouched.
film = DIST / "assets" / "made-with-africa-presentation-final-1080p.mp4"
if not film.exists():
    parts = sorted((ROOT / "assets" / "video-parts").glob("*.part-*"))
    if len(parts) != 5:
        raise RuntimeError("Les cinq parties de la vidéo 1080p sont manquantes.")
    with film.open("wb") as output:
        for part in parts:
            with part.open("rb") as source:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
    digest = sha256(film.read_bytes()).hexdigest()
    if digest != "bfd6be69d10bdd2e4d3b10254f66d61b1f7b1376b83e00f09f5cd4e57fd49532":
        film.unlink()
        raise RuntimeError("La vidéo 1080p reconstituée est incomplète.")

print(f"Aperçu prêt : {DIST}")
print("Aucun secret ni code serveur dans le dossier public.")
