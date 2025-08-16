#!/usr/bin/env python3
"""
Descarga 30 logos de MLB desde una lista de URLs y los guarda en una carpeta.
- Nombra los archivos como <slug>_<teamId>.<ext> (ej: bos_111.svg)
- Crea un ZIP opcional con todo el set
"""

import os
import re
import sys
import time
import zipfile
from pathlib import Path

import requests

# ======= CONFIGURACIÓN =======
OUTPUT_DIR = Path("mlb_logos_svg")  # carpeta destino
MAKE_ZIP = True                     # crear ZIP al finalizar
TIMEOUT = 20                        # timeout por descarga (s)
RETRIES = 3                         # reintentos por URL
SLEEP_BETWEEN = 0.3                 # pausa entre intentos
# =============================

# Mapa de teamId -> (slug, nombre) alineado con tus IDs
TEAM_MAP = {
    109: ("ari", "Arizona Diamondbacks"),
    133: ("oak", "Oakland Athletics"),
    144: ("atl", "Atlanta Braves"),
    110: ("bal", "Baltimore Orioles"),
    111: ("bos", "Boston Red Sox"),
    112: ("chc", "Chicago Cubs"),
    145: ("chw", "Chicago White Sox"),
    113: ("cin", "Cincinnati Reds"),
    114: ("cle", "Cleveland Guardians"),
    115: ("col", "Colorado Rockies"),
    116: ("det", "Detroit Tigers"),
    117: ("hou", "Houston Astros"),
    118: ("kcr", "Kansas City Royals"),
    108: ("ana", "Los Angeles Angels"),
    119: ("lad", "Los Angeles Dodgers"),
    146: ("mia", "Miami Marlins"),
    158: ("mil", "Milwaukee Brewers"),
    142: ("min", "Minnesota Twins"),
    121: ("nym", "New York Mets"),
    147: ("nyy", "New York Yankees"),
    143: ("phi", "Philadelphia Phillies"),
    134: ("pit", "Pittsburgh Pirates"),
    135: ("sdp", "San Diego Padres"),
    137: ("sfg", "San Francisco Giants"),
    136: ("sea", "Seattle Mariners"),
    138: ("stl", "St. Louis Cardinals"),
    139: ("tbr", "Tampa Bay Rays"),
    140: ("tex", "Texas Rangers"),
    141: ("tor", "Toronto Blue Jays"),
    120: ("was", "Washington Nationals"),
}

# Tus 30 URLs (pegadas tal cual)
URLS = [
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/109.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/133.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/144.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/110.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/111.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/112.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/145.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/113.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/114.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/115.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/116.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/117.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/118.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/108.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/119.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/146.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/158.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/142.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/121.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/147.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/143.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/134.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/135.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/137.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/136.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/138.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/139.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/140.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/141.svg",
    "https://www.mlbstatic.com/team-logos/team-cap-on-light/120.svg",
]

def parse_id_from_url(url: str) -> int:
    m = re.search(r"/(\d+)\.(svg|png)$", url)
    if not m:
        raise ValueError(f"No se pudo extraer teamId/extension de: {url}")
    return int(m.group(1)), m.group(2).lower()

def suggest_filename(team_id: int, ext: str) -> str:
    slug, _name = TEAM_MAP.get(team_id, (str(team_id), f"Team {team_id}"))
    return f"{slug}_{team_id}.{ext}"

def download(url: str, dst: Path) -> None:
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(url, timeout=TIMEOUT)
            r.raise_for_status()
            ctype = r.headers.get("Content-Type", "").lower()
            # Validación simple de tipo
            if not ("svg" in ctype or "image" in ctype):
                print(f"  Aviso: Content-Type sospechoso ({ctype}) para {url}", file=sys.stderr)
            dst.write_bytes(r.content)
            return
        except Exception as e:
            print(f"  Error intento {attempt}/{RETRIES} al descargar {url}: {e}", file=sys.stderr)
            if attempt < RETRIES:
                time.sleep(SLEEP_BETWEEN)
            else:
                raise

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ok, fail = 0, 0

    for url in URLS:
        try:
            team_id, ext = parse_id_from_url(url)
            fname = suggest_filename(team_id, ext)
            out_path = OUTPUT_DIR / fname

            if out_path.exists():
                print(f"[SKIP] {fname} (ya existe)")
            else:
                print(f"[GET ] {fname} <- {url}")
                download(url, out_path)
            ok += 1
        except Exception as e:
            print(f"[FAIL] {url} -> {e}", file=sys.stderr)
            fail += 1

    print(f"\nDescargas completas: {ok} | Fallidas: {fail}")
    if MAKE_ZIP:
        zip_path = OUTPUT_DIR.with_suffix(".zip")
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for p in OUTPUT_DIR.glob("*.*"):
                zf.write(p, arcname=p.name)
        print(f"ZIP generado: {zip_path.resolve()}")

if __name__ == "__main__":
    main()
