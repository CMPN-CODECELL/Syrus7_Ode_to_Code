"""Agricultural Glossary and Semantic Normalization Layer for KrishiNirnay.
Normalizes Marathi, Hindi, and regional farming vocabulary before LLM / Engine.
"""

import re
from typing import Dict, Any, Optional, Tuple, List
from contracts.schemas.assist import SlotSchema

# Canonical mapping for agricultural terms
GLOSSARY_MAP: Dict[str, Dict[str, str]] = {
    # Price
    "भाव": {"canonical": "modal_price", "type": "metric"},
    "दर": {"canonical": "modal_price", "type": "metric"},
    "रेट": {"canonical": "modal_price", "type": "metric"},
    "दाम": {"canonical": "modal_price", "type": "metric"},

    # Arrivals
    "आवक": {"canonical": "arrivals_volume", "type": "metric"},
    "गाडी आली": {"canonical": "arrivals_volume", "type": "metric"},
    "गाड्या": {"canonical": "arrivals_volume", "type": "metric"},

    # Minimum Support Price
    "हमीभाव": {"canonical": "minimum_support_price", "type": "metric"},
    "एमएसपी": {"canonical": "minimum_support_price", "type": "metric"},
    "msp": {"canonical": "minimum_support_price", "type": "metric"},

    # Units
    "क्विंटल": {"canonical": "qtl", "type": "unit"},
    "क्विं": {"canonical": "qtl", "type": "unit"},
    "कट्टा": {"canonical": "bag", "type": "bag_requires_weight"},
    "katta": {"canonical": "bag", "type": "bag_requires_weight"},
    "पोतं": {"canonical": "bag", "type": "bag_requires_weight"},
    "पोता": {"canonical": "bag", "type": "bag_requires_weight"},
    "pota": {"canonical": "bag", "type": "bag_requires_weight"},
    "बोरी": {"canonical": "bag", "type": "bag_requires_weight"},
    "bori": {"canonical": "bag", "type": "bag_requires_weight"},
    "गोणी": {"canonical": "bag", "type": "bag_requires_weight"},
    "bag": {"canonical": "bag", "type": "bag_requires_weight"},
    "bags": {"canonical": "bag", "type": "bag_requires_weight"},
    "टन": {"canonical": "tonne", "type": "unit"},
    "किलो": {"canonical": "kg", "type": "unit"},

    # Spoilage / Loss
    "नासाडी": {"canonical": "spoilage", "type": "risk"},
    "खराब": {"canonical": "spoilage", "type": "risk"},
    "सडला": {"canonical": "spoilage", "type": "risk"},
    "सड": {"canonical": "spoilage", "type": "risk"},
    "नुकसान": {"canonical": "loss", "type": "risk"},

    # Logistics / Transport
    "वाहतूक": {"canonical": "transport", "type": "cost"},
    "गाडी भाडं": {"canonical": "transport", "type": "cost"},
    "भाडे": {"canonical": "transport", "type": "cost"},
    "गाडीभाडे": {"canonical": "transport", "type": "cost"},
    "किराया": {"canonical": "transport", "type": "cost"},

    # Realization / Net profit
    "नफा": {"canonical": "net_realization", "type": "return"},
    "फायदा": {"canonical": "net_realization", "type": "return"},
    "शिल्लक": {"canonical": "net_realization", "type": "return"},
    "बचत": {"canonical": "net_realization", "type": "return"},

    # Commodities
    "टोमॅटो": {"canonical": "Tomato", "type": "commodity"},
    "टमाटर": {"canonical": "Tomato", "type": "commodity"},
    "tomato": {"canonical": "Tomato", "type": "commodity"},
    "कांदा": {"canonical": "Onion", "type": "commodity"},
    "प्याज": {"canonical": "Onion", "type": "commodity"},
    "onion": {"canonical": "Onion", "type": "commodity"},

    # Mandis
    "नाशिक": {"canonical": "Nashik APMC", "type": "mandi"},
    "पिंपळगाव": {"canonical": "Pimpalgaon Baswant APMC", "type": "mandi"},
    "पिंपलगाव": {"canonical": "Pimpalgaon Baswant APMC", "type": "mandi"},
    "लासलगाव": {"canonical": "Lasalgaon APMC", "type": "mandi"},
    "पुणे": {"canonical": "Pune APMC", "type": "mandi"}
}

class AgriculturalGlossary:
    @classmethod
    def normalize_text(cls, text: str) -> str:
        """Standardizes common variants in input text."""
        normalized = text.strip()
        return normalized

    @classmethod
    def extract_semantic_slots(cls, text: str, existing_slots: Optional[SlotSchema] = None) -> SlotSchema:
        """
        Deterministically extracts and validates slots from voice/text transcript.
        Enforces bag-weight requirement: If user mentions bags/katta/potan without weight,
        it flags ambiguous_slots and missing_slots.
        """
        slots = existing_slots.model_copy(deep=True) if existing_slots else SlotSchema()
        lower_text = text.lower()

        # 1. Commodity extraction
        for token, entry in GLOSSARY_MAP.items():
            if entry["type"] == "commodity" and token.lower() in lower_text:
                slots.commodity = entry["canonical"]
                break

        # 2. Mandi extraction
        for token, entry in GLOSSARY_MAP.items():
            if entry["type"] == "mandi" and token.lower() in lower_text:
                if not slots.home_mandi or "other" in lower_text or "dusri" in lower_text or "दुसऱ्या" in lower_text:
                    if slots.home_mandi and slots.home_mandi != entry["canonical"]:
                        slots.target_mandi = entry["canonical"]
                    else:
                        slots.home_mandi = entry["canonical"]
                else:
                    slots.home_mandi = entry["canonical"]

        # 3. Quantity & Unit extraction
        # e.g., "25 quintal", "२५ क्विंटल", "30 पोतं", "20 qtl"
        from apps.api.llm.number_guard import normalize_devanagari_numbers
        ascii_text = normalize_devanagari_numbers(lower_text)

        # Regex for quantity followed by unit or bag keyword
        qty_pattern = re.compile(r'(\d+(?:\.\d+)?)\s*(क्विंटल|क्विं|qtl|quintal|कट्टा|katta|पोतं|पोता|pota|बोरी|bori|गोणी|bags?|टन|tonne|किलो|kg)?', re.IGNORECASE)
        matches = qty_pattern.findall(ascii_text)

        bag_found = False
        bag_qty = 0.0

        for num_str, unit_str in matches:
            val = float(num_str)
            # Skip if value is a year (e.g. 2026) or day count (e.g. 2 or 3 days)
            if "दिवस" in lower_text or "day" in lower_text or "दिन" in lower_text:
                if val in [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0] and ("दिवस" in ascii_text or "day" in ascii_text):
                    slots.requested_wait_days = int(val)
                    continue

            unit_str_clean = unit_str.strip().lower()
            if unit_str_clean in ["कट्टा", "katta", "पोतं", "पोता", "pota", "बोरी", "bori", "गोणी", "bag", "bags"]:
                bag_found = True
                bag_qty = val
            elif unit_str_clean in ["क्विंटल", "क्विं", "qtl", "quintal"]:
                slots.quantity = val
                slots.quantity_unit = "qtl"
            elif unit_str_clean in ["टन", "tonne"]:
                slots.quantity = val * 10.0 # 1 tonne = 10 qtl
                slots.quantity_unit = "qtl"
            elif unit_str_clean in ["किलो", "kg"]:
                slots.quantity = val / 100.0 # 100 kg = 1 qtl
                slots.quantity_unit = "qtl"
            elif val >= 5.0 and slots.quantity is None: # assume quintal for standalone typical farmer quantity
                slots.quantity = val
                slots.quantity_unit = "qtl"

        # Check bag weight constraint: "Bag/sack language must NOT be converted until bag weight is known."
        if bag_found:
            if slots.bag_weight_kg is not None:
                # Convert bags to quintals: bags * bag_weight / 100
                slots.quantity = (bag_qty * slots.bag_weight_kg) / 100.0
                slots.quantity_unit = "qtl"
            else:
                slots.quantity = None # Block conversion!
                if "bag_weight_kg" not in slots.missing_slots:
                    slots.missing_slots.append("bag_weight_kg")
                if "कट्टा / पोतं वजन" not in slots.ambiguous_slots:
                    slots.ambiguous_slots.append("कट्टा / पोतं वजन (एका पोत्याचे वजन किती किलो आहे?)")

        # 4. Check wait days if mentioned separately
        day_match = re.search(r'(\d+)\s*(?:दिवस|day|days|दिन)', ascii_text)
        if day_match:
            slots.requested_wait_days = int(day_match.group(1))

        # Check completeness
        slots.missing_slots = []
        if not slots.commodity:
            slots.missing_slots.append("commodity")
        if slots.quantity is None:
            if bag_found:
                slots.missing_slots.append("bag_weight_kg")
            else:
                slots.missing_slots.append("quantity")
        if not slots.home_mandi:
            slots.missing_slots.append("home_mandi")

        slots.is_complete = len(slots.missing_slots) == 0

        return slots
