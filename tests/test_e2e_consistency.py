"""End-to-end consistency tests across API, record, text, and TTS source text.
Acceptance condition: Identical numbers across all representations.
"""

import pytest
import re
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.llm.number_guard import NumberGuard

client = TestClient(app)

def test_e2e_number_consistency_golden():
    res = client.post("/api/assist", json={
        "session_id": "pytest-e2e-consistency",
        "message": "20 quintal tomato in Nashik wait 2 days",
        "language": "mr-IN",
        "input_mode": "text"
    })
    assert res.status_code == 200
    data = res.json()
    rec = data["decision_record"]
    assistant_text = data["assistant_text"]
    spoken_summary = data["spoken_summary"]

    # 1. Exact numbers in record
    base_net = rec["baseline"]["net_total"] # 33960.0
    wait_net = rec["chosen"]["net_total"] # 36055.0
    gain_net = rec["chosen"]["gain_total"] # 2095.0
    reservation_price = rec["chosen"]["reservation_price"] # 1842.0

    assert base_net == 33960.0
    assert wait_net == 36055.0
    assert gain_net == 2095.0
    assert reservation_price == 1842.0

    # 2. Assert that assistant text contains the exact net and gain
    assert "36,055" in assistant_text or "३६,०५५" in assistant_text or "36055" in assistant_text
    assert "2,095" in assistant_text or "२,०९५" in assistant_text or "2095" in assistant_text
    assert "33,960" in assistant_text or "३३,९६०" in assistant_text or "33960" in assistant_text
    assert "1,842" in assistant_text or "१,८४२" in assistant_text or "1842" in assistant_text

    # 3. Assert that spoken summary contains the exact net and gain
    assert "36,055" in spoken_summary or "३६,०५५" in spoken_summary or "36055" in spoken_summary
    assert "2,095" in spoken_summary or "२,०९५" in spoken_summary or "2095" in spoken_summary

    # 4. Assert that Number Guard validates both assistant_text and spoken_summary
    # Need to convert dictionary to Pydantic DecisionRecord for validator
    from contracts.schemas.decision_record import DecisionRecord
    pydantic_rec = DecisionRecord(**rec)

    is_valid_text, errs_text = NumberGuard.validate(assistant_text, pydantic_rec)
    assert is_valid_text is True, f"Assistant text contained unauthorized numbers: {errs_text}"

    is_valid_spoken, errs_spoken = NumberGuard.validate(spoken_summary, pydantic_rec)
    assert is_valid_spoken is True, f"Spoken summary contained unauthorized numbers: {errs_spoken}"

    # 5. Check heatmap endpoint cell matches
    res_hm = client.get("/api/heatmap")
    assert res_hm.status_code == 200
    hm_data = res_hm.json()
    nashik_day2_cell = hm_data["matrix"][0][2]
    assert nashik_day2_cell["net_realization"] == 36055.0
    assert nashik_day2_cell["gain_vs_baseline"] == 2095.0
    assert nashik_day2_cell["is_best"] is True
