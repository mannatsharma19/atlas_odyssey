import os
import json
from data_part_1 import PART_A_F
from data_part_2 import PART_G_M
from data_part_3 import PART_N_Z

os.makedirs('data/countries', exist_ok=True)

def flag_emoji(c2):
    if not c2 or len(c2) != 2: return "🌐"
    return "".join(chr(127397 + ord(c)) for c in c2.upper())

def flag_url(c2):
    if not c2 or len(c2) != 2: return "https://flagcdn.com/w320/un.png"
    return f"https://flagcdn.com/w320/{c2.lower()}.png"

# Combine all parts
MASTER = {}
MASTER.update(PART_A_F)
MASTER.update(PART_G_M)
MASTER.update(PART_N_Z)

print(f"Total countries in master catalog: {len(MASTER)}")

countries_index = []

for cid, item in MASTER.items():
    (c2, name, capital, currency, population, popular_cities, languages,
     famous_for, tourists, must_know, fun_fact, continent, lat, lng,
     dish, attire, festival, place) = item

    flag = flag_emoji(c2)
    flag_svg = flag_url(c2)

    # Hero image curated or fallback
    hero_img = f"https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop"
    if continent == "Europe":
        hero_img = "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1200&auto=format&fit=crop"
    elif continent == "Asia":
        hero_img = "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop"
    elif continent == "Africa":
        hero_img = "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1200&auto=format&fit=crop"
    elif continent == "South America":
        hero_img = "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?q=80&w=1200&auto=format&fit=crop"
    elif continent == "Oceania":
        hero_img = "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop"
    elif continent == "North America":
        hero_img = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop"

    # Specific hero images for famous nations
    SPECIFIC_HERO = {
        "JPN": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
        "BRA": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=1200&auto=format&fit=crop",
        "EGY": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
        "IND": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200&auto=format&fit=crop",
        "ITA": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop",
        "FRA": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
        "USA": "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?q=80&w=1200&auto=format&fit=crop",
        "GBR": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop",
        "AUS": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop",
        "CAN": "https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=1200&auto=format&fit=crop",
        "ESP": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=1200&auto=format&fit=crop",
        "CHN": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=1200&auto=format&fit=crop",
        "KOR": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=1200&auto=format&fit=crop",
        "MEX": "https://images.unsplash.com/photo-1518638150340-f706e86654de?q=80&w=1200&auto=format&fit=crop",
        "ISL": "https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=1200&auto=format&fit=crop",
        "ZAF": "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1200&auto=format&fit=crop",
        "NZL": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
        "CHE": "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop",
        "THA": "https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1200&auto=format&fit=crop",
        "GRC": "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop",
        "TUR": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1200&auto=format&fit=crop",
        "PER": "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1200&auto=format&fit=crop"
    }
    if cid in SPECIFIC_HERO:
        hero_img = SPECIFIC_HERO[cid]

    # Index entry
    index_item = {
        "id": cid,
        "name": name,
        "capital": capital,
        "currency": currency,
        "population": population,
        "popular_cities": popular_cities,
        "languages": languages,
        "famous_for": famous_for,
        "tourists": tourists,
        "must_know": must_know,
        "fun_fact": fun_fact,
        "lat": lat,
        "lng": lng,
        "continent": continent,
        "short_desc": famous_for[:140] + ("..." if len(famous_for) > 140 else ""),
        "flag": flag,
        "flag_svg": flag_svg,
        "hero_image": hero_img
    }
    countries_index.append(index_item)

    # Full country detail file
    detail_data = {
        "id": cid,
        "name": name,
        "capital": capital,
        "currency": currency,
        "population": population,
        "popular_cities": popular_cities,
        "languages": languages,
        "famous_for": famous_for,
        "tourists": tourists,
        "flag": flag,
        "flag_svg": flag_svg,
        "must_know": must_know,
        "fun_fact": fun_fact,
        "continent": continent,
        "lat": lat,
        "lng": lng,
        "government": "Sovereign State",
        "hero_image": hero_img,
        "area": "Covering vast regional terrain",
        "gdp": "Dynamic economy",
        "density": "Vibrant population density",
        "languages_count": len(languages),
        "geography": {
            "mountains": f"Highlands, peaks, and iconic natural terrain of {name}",
            "rivers": f"Major waterways, coastal shores, and river basins of {name}",
            "climate": f"Regional climate with distinct seasonal variations across {name}",
            "terrain": f"Scenic diverse landscapes defining the beauty of {name}"
        },
        "culture": [
            {
                "title": "Hospitality & Warmth",
                "desc": f"Deeply cherished cultural traditions of welcoming visitors with generosity and respect across {name}.",
                "icon": "🤝"
            },
            {
                "title": "Living Heritage & Art",
                "desc": f"Generations of folklore, architecture, music, and master craftsmanship preserved proudly in {name}.",
                "icon": "🏛️"
            },
            {
                "title": "Celebration & Community",
                "desc": f"Vibrant festive gatherings, storytelling, and community bonds connecting people in {name}.",
                "icon": "✨"
            }
        ],
        "food": [
            {
                "name": dish,
                "desc": f"Signature culinary tradition and beloved staple dish celebrated across {name}.",
                "image": "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Artisanal Regional Sweets",
                "desc": f"Delicate confectionery, pastries, and festive celebration desserts cherished throughout {name}.",
                "image": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop"
            }
        ],
        "clothing": {
            "title": attire,
            "desc": f"Iconic traditional folk garments and woven cultural clothing worn during ceremonies and festivals in {name}.",
            "image": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=600&auto=format&fit=crop"
        },
        "festivals": [
            {
                "name": festival,
                "date": "National Festive Calendar",
                "desc": f"High-spirited nationwide celebration filled with traditional music, dance, pageantry, and joyous feasts."
            }
        ],
        "famous_places": [
            {
                "name": place,
                "desc": f"World-renowned cultural landmark and iconic destination attracting global travelers to {name}.",
                "image": hero_img
            }
        ],
        "gallery": [
            hero_img,
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop"
        ],
        "timeline": [
            {
                "era": "Ancestral Heritage",
                "event": f"Early cultural foundations, ancient trade roots, and historical settlements that shaped the legacy of {name}."
            },
            {
                "era": "Modern Sovereignty",
                "event": f"Contemporary era marked by vibrant cultural renaissance, international ties, and enduring traditions."
            }
        ],
        "unique_facts": [
            fun_fact,
            must_know,
            f"Famous for {famous_for}"
        ]
    }

    # Write individual country JSON
    cpath = os.path.join('data', 'countries', f'{cid}.json')
    with open(cpath, 'w', encoding='utf-8') as f:
        json.dump(detail_data, f, indent=2, ensure_ascii=False)

# Sort index alphabetically by name
countries_index.sort(key=lambda x: x["name"])

# Write countries_index.json
with open('data/countries_index.json', 'w', encoding='utf-8') as f:
    json.dump(countries_index, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {len(countries_index)} individual country files and data/countries_index.json!")

