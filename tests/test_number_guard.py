"""Unit tests for Number Guard safety system."""

import pytest
from apps.api.mock_engine.deterministic_engine import engine
from apps.api.llm.number_guard import NumberGuard, normalize_devanagari_numbers

def test_number_guard_accepts_valid_numbers():
    rec = engine.analyze_sale_decision(commodity="Tomato", quantity=20.0, home_mandi="Nashik APMC", requested_wait_days=2)
    valid_text = (
        "२ दिवस थांबा (Nashik APMC). अंदाजे निव्वळ नफा ₹36,055 मिळेल, "
        "जो आज विकल्यास मिळणाऱ्या ₹33,960 पेक्षा ₹2,095 जास्त आहे. "
        "किमान आरक्षण भाव ₹1,842/क्विंटल आहे. यशस्वी होण्याची शक्यता 62.4% आहे."
    )
    is_valid, unsupported = NumberGuard.validate(valid_text, rec)
    assert is_valid is True, f"Expected valid text to pass, but got unsupported: {unsupported}"
    assert len(unsupported) == 0

def test_number_guard_rejects_hallucinated_numbers():
    rec = engine.analyze_sale_decision(commodity="Tomato", quantity=20.0, home_mandi="Nashik APMC", requested_wait_days=2)
    # 40,350 is an unauthorized invented number
    hallucinated_text = (
        "२ दिवस थांबा. आपण ₹40,350 निव्वळ नफा कमवू शकता."
    )
    is_valid, unsupported = NumberGuard.validate(hallucinated_text, rec)
    assert is_valid is False
    assert any("40350" in u or "40,350" in u for u in unsupported)

def test_number_guard_devanagari_digits():
    rec = engine.analyze_sale_decision(commodity="Tomato", quantity=20.0, home_mandi="Nashik APMC", requested_wait_days=2)
    devanagari_text = "२ दिवस थांबा. ३६,०५५ रुपये नफा मिळेल आणि २,०९५ वाढ होईल."
    is_valid, unsupported = NumberGuard.validate(devanagari_text, rec)
    assert is_valid is True, f"Failed on Devanagari numerals: {unsupported}"
