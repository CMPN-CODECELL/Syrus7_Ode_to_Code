"""
services/decision/market_mapping.py

Market Identifier & Canonical Alias Mapping for KrishiNirnay.
Project Tagline: "Sahi Bhav Se, Samriddhi Ki Raah Pe"
Authority: SYRUS_PS02_MASTER.md & SYRUS_PS02_DIVISION_2_DECISION_RISK_ENGINE.md

Bridges AGMARKNET source naming conventions (e.g. "APMC Nasik", "APMC Pimpalgaon Baswant", "APMC Sangamner")
with product canonical names ("Nashik APMC", "Pimpalgaon Baswant APMC", "Sangamner APMC", "Lasalgaon APMC").
Preserves source market names for data provenance and audit trails.
"""

from __future__ import annotations

import re
from typing import Dict, Tuple, Optional, List
from pydantic import BaseModel, Field

# Mapping from lowercase normalized alias -> Canonical Product Name
MANDI_ALIAS_MAP: Dict[str, str] = {
    # Nashik aliases
    "apmc nasik": "Nashik APMC",
    "nasik apmc": "Nashik APMC",
    "nashik apmc": "Nashik APMC",
    "nashik": "Nashik APMC",
    "nasik": "Nashik APMC",
    "nashik_apmc": "Nashik APMC",

    # Pimpalgaon Baswant aliases
    "apmc pimpalgaon baswant": "Pimpalgaon Baswant APMC",
    "pimpalgaon baswant apmc": "Pimpalgaon Baswant APMC",
    "pimpalgaon apmc": "Pimpalgaon Baswant APMC",
    "pimpalgaon baswant": "Pimpalgaon Baswant APMC",
    "pimpalgaon": "Pimpalgaon Baswant APMC",
    "pimpalgaon_apmc": "Pimpalgaon Baswant APMC",

    # Sangamner aliases
    "apmc sangamner": "Sangamner APMC",
    "sangamner apmc": "Sangamner APMC",
    "sangamner": "Sangamner APMC",
    "sangamner_apmc": "Sangamner APMC",

    # Lasalgaon aliases
    "apmc lasalgaon": "Lasalgaon APMC",
    "lasalgaon apmc": "Lasalgaon APMC",
    "lasalgaon": "Lasalgaon APMC",
    "lasalgaon_apmc": "Lasalgaon APMC",

    # Pune aliases
    "apmc pune": "Pune APMC",
    "pune apmc": "Pune APMC",
    "pune": "Pune APMC",
    "pune_apmc": "Pune APMC",

    # Mumbai / Vashi aliases
    "mumbai apmc (vashi)": "Mumbai APMC (Vashi)",
    "mumbai apmc": "Mumbai APMC (Vashi)",
    "vashi apmc": "Mumbai APMC (Vashi)",
    "vashi": "Mumbai APMC (Vashi)",
    "mumbai_apmc": "Mumbai APMC (Vashi)",

    # Kalvan & Yeola
    "kalvan apmc": "Kalvan APMC",
    "kalvan": "Kalvan APMC",
    "yeola apmc": "Yeola APMC",
    "yeola": "Yeola APMC"
}

# Reverse mapping: Canonical Name -> AGMARKNET dataset source name
CANONICAL_TO_SOURCE_NAME: Dict[str, str] = {
    "Nashik APMC": "APMC Nasik",
    "Pimpalgaon Baswant APMC": "APMC Pimpalgaon Baswant",
    "Sangamner APMC": "APMC Sangamner",
    "Lasalgaon APMC": "Lasalgaon APMC",
    "Pune APMC": "Pune APMC",
    "Mumbai APMC (Vashi)": "Mumbai APMC (Vashi)",
    "Kalvan APMC": "Kalvan APMC",
    "Yeola APMC": "Yeola APMC"
}

# Coordinates for known canonical mandis
CANONICAL_MANDI_COORDS: Dict[str, Tuple[float, float]] = {
    "Nashik APMC": (19.9975, 73.7898),
    "Pimpalgaon Baswant APMC": (20.1738, 73.9877),
    "Sangamner APMC": (19.5760, 74.2070),
    "Lasalgaon APMC": (20.1472, 74.2263),
    "Pune APMC": (18.5204, 73.8567),
    "Mumbai APMC (Vashi)": (19.0760, 72.9986),
    "Kalvan APMC": (20.4855, 73.9631),
    "Yeola APMC": (20.0435, 74.4878)
}


class MandiIdentity(BaseModel):
    """Traceable mandi identity model preserving both canonical and raw source names."""
    canonical_name: str
    source_name: str
    id: str
    coordinates: Tuple[float, float]


def canonicalize_mandi_name(raw_name: str) -> str:
    """
    Normalizes any mandi alias, ID, or AGMARKNET string into the product's canonical name.
    Preserves unknown names cleanly if no alias matches.
    """
    if not raw_name:
        return "Nashik APMC"
    cleaned = raw_name.strip().lower()
    cleaned = re.sub(r"\s+", " ", cleaned)
    if cleaned in MANDI_ALIAS_MAP:
        return MANDI_ALIAS_MAP[cleaned]
    # Check partial match
    for alias, canonical in MANDI_ALIAS_MAP.items():
        if alias in cleaned or cleaned in alias:
            return canonical
    return raw_name.strip()


def get_source_mandi_name(canonical_name: str) -> str:
    """Returns the AGMARKNET dataset representation for a canonical mandi name."""
    c_name = canonicalize_mandi_name(canonical_name)
    return CANONICAL_TO_SOURCE_NAME.get(c_name, c_name)


def resolve_mandi_identity(name_or_alias: str) -> MandiIdentity:
    """Resolves full MandiIdentity including canonical name, source name, ID and coordinates."""
    c_name = canonicalize_mandi_name(name_or_alias)
    s_name = get_source_mandi_name(c_name)
    m_id = c_name.lower().replace(" ", "_").replace("(", "").replace(")", "")
    coords = CANONICAL_MANDI_COORDS.get(c_name, (19.9975, 73.7898))
    return MandiIdentity(
        canonical_name=c_name,
        source_name=s_name,
        id=m_id,
        coordinates=coords
    )
