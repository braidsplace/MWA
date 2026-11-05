#!/usr/bin/env python3
"""Create an IONOS Web Hosting upload package without private credentials."""

from pathlib import Path
from shutil import copy2, copytree, rmtree
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parent.parent
IONOS = ROOT / "ionos"
DIST = IONOS / "dist"
PACKAGE = DIST / "sisi-in-africa"
PUBLIC = PACKAGE / "public"
PRIVATE = PACKAGE / "private"

if PACKAGE.exists():
    rmtree(PACKAGE)
PUBLIC.mkdir(parents=True)
PRIVATE.mkdir(parents=True)

for source in sorted(ROOT.glob("*.html")):
    copy2(source, PUBLIC / source.name)
for source in sorted(ROOT.glob("*.css")):
    copy2(source, PUBLIC / source.name)
for name in ("script.js", "candidature.js"):
    copy2(ROOT / name, PUBLIC / name)
copytree(ROOT / "assets", PUBLIC / "assets")

copy2(IONOS / "public" / ".htaccess", PUBLIC / ".htaccess")
(PUBLIC / "api").mkdir()
copy2(IONOS / "public" / "api" / "candidatures.php", PUBLIC / "api" / "candidatures.php")
copy2(IONOS / "private" / "candidatures.php", PRIVATE / "candidatures.php")
copy2(IONOS / "private" / "config.example.php", PRIVATE / "config.example.php")

archive = DIST / "sisi-in-africa-ionos.zip"
with ZipFile(archive, "w", ZIP_DEFLATED) as output:
    for path in sorted(PACKAGE.rglob("*")):
        if path.is_file():
            output.write(path, path.relative_to(DIST))

print(f"Package: {PACKAGE}")
print(f"Archive: {archive}")
print("No Notion token is included. The server needs private/config.php.")
