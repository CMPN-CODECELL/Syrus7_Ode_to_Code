"""Unit tests for Agricultural Glossary and Semantic Normalization."""

import pytest
from apps.api.voice.glossary import AgriculturalGlossary
from contracts.schemas.assist import SlotSchema

def test_extract_basic_marathi_slots():
    text = "२५ क्विंटल टोमॅटो, आज नाशिकला विकू की २ दिवस थांबू?"
    slots = AgriculturalGlossary.extract_semantic_slots(text)
    assert slots.commodity == "Tomato"
    assert slots.quantity == 25.0
    assert slots.quantity_unit == "qtl"
    assert slots.home_mandi == "Nashik APMC"
    assert slots.requested_wait_days == 2
    assert slots.is_complete is True

def test_bag_requires_weight_invariant():
    # When user specifies bags without weight
    text = "५० पोतं टोमॅटो नाशिक"
    slots = AgriculturalGlossary.extract_semantic_slots(text)
    assert slots.commodity == "Tomato"
    assert slots.quantity is None # Must not convert!
    assert "bag_weight_kg" in slots.missing_slots
    assert slots.is_complete is False

def test_bag_with_known_weight_converts_correctly():
    # When bag weight is supplied: 50 bags * 50 kg / 100 = 25 quintals
    existing = SlotSchema(bag_weight_kg=50.0)
    text = "५० पोतं टोमॅटो नाशिक"
    slots = AgriculturalGlossary.extract_semantic_slots(text, existing_slots=existing)
    assert slots.commodity == "Tomato"
    assert slots.quantity == 25.0 # 50 * 50 / 100
    assert slots.quantity_unit == "qtl"
    assert slots.is_complete is True
