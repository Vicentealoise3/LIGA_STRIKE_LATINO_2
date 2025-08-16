import json
import csv
import sys
from pathlib import Path

import requests

# ========= CONFIGURA AQUÍ =========
SEASON = "2025"                     # temporada a consultar
STYLE = "team-cap-on-light"         # opciones comunes: team-cap-on-light | team-cap-on-dark | primary-on-light | primary-on-dark
EXT = "svg"                         # "svg" o "png"
OUT_PREFIX = f"mlb_logos_{SEASON}_{STYLE}.{EXT}"
# ==================================

API = "https://statsapi.mlb.com/api/v1/teams"
params = {
    "sportId": "1",        # 1 = MLB (no MiLB)
    "season": SEASON,
    "activeStatus": "Y"    # equipos activos
}

resp = requests.get(API, params=params, timeout=20)
resp.raise_for_status()
data = resp.json()

teams = []
for t in data.get("teams", []):
    # Filtramos solo franquicias MLB (por sportId) y activas
    if str(t.get("sport", {}).get("id")) == "1":
        teams.append({
            "id": t["id"],
            "name": t["name"],
            "abbrev": t.get("abbreviation", ""),
            "locationName": t.get("locationName", ""),
            "teamName": t.get("teamName", "")
        })

# Validación básica: deberían ser 30
teams_sorted = sorted(teams, key=lambda x: x["name"])
if len(teams_sorted) != 30:
    print(f"ADVERTENCIA: Se obtuvieron {len(teams_sorted)} equipos (se esperaban 30).", file=sys.stderr)

# Construye URLs
BASE = f"https://www.mlbstatic.com/team-logos/{STYLE}"
for t in teams_sorted:
    t["logo_url"] = f"{BASE}/{t['id']}.{EXT}"

# Exporta a JSON
json_path = Path(f"{OUT_PREFIX}.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(teams_sorted, f, ensure_ascii=False, indent=2)

# Exporta a CSV
csv_path = Path(f"{OUT_PREFIX}.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "abbrev", "id", "logo_url"])
    for t in teams_sorted:
        writer.writerow([t["name"], t["abbrev"], t["id"], t["logo_url"]])

# Imprime un listado rápido en consola (Markdown)
print("# MLB Logos")
print(f"_Season {SEASON} · Style `{STYLE}` · Ext `{EXT}`_")
for t in teams_sorted:
    print(f"- **{t['name']}** (ID {t['id']}): {t['logo_url']}")

print(f"\nArchivos creados: {json_path} y {csv_path}")
