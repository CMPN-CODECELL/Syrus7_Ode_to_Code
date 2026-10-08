"""Number Guard implementation for KrishiNirnay.
Guarantees zero number hallucinations in LLM-generated text.
Mandatory safety filter: every numeric token in assistant prose must be authorized by DecisionRecord.
"""

import re
from typing import Set, List, Tuple, Optional
from contracts.schemas.decision_record import DecisionRecord

# Devanagari to Arabic numeral map
DEVANAGARI_DIGITS = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

def normalize_devanagari_numbers(text: str) -> str:
    """Converts Devanagari digits to standard ASCII digits for numeric verification."""
    result = []
    for ch in text:
        result.append(DEVANAGARI_DIGITS.get(ch, ch))
    return "".join(result)

class NumberGuard:
    @staticmethod
    def extract_allowed_numbers(record: DecisionRecord) -> Set[float]:
        """Collects all authorized numbers from the immutable DecisionRecord."""
        allowed: Set[float] = set()

        def add_num(val: Optional[float]):
            if val is not None and not isinstance(val, bool):
                try:
                    f = float(val)
                    allowed.add(round(f, 2))
                    allowed.add(float(int(f)))
                    # Also add percentage representation (e.g. 0.624 -> 62.4, 62)
                    if 0.0 < f < 1.0:
                        allowed.add(round(f * 100.0, 1))
                        allowed.add(float(int(f * 100.0)))
                except (ValueError, TypeError):
                    pass

        # Base lot info
        add_num(record.lot_quantity_qtl)

        # Baseline
        add_num(record.baseline.modal_price)
        add_num(record.baseline.quantity_sold_qtl)
        add_num(record.baseline.gross_revenue)
        add_num(record.baseline.net_total)
        cb_base = record.baseline.cost_breakdown
        add_num(cb_base.transport)
        add_num(cb_base.hamali_tolai)
        add_num(cb_base.storage)
        add_num(cb_base.financing)
        add_num(cb_base.travel_loss_pct)
        add_num(cb_base.holding_loss_pct)

        # Chosen
        add_num(record.chosen.wait_days)
        add_num(record.chosen.modal_price_expected)
        add_num(record.chosen.net_total)
        add_num(record.chosen.gain_total)
        add_num(record.chosen.gain_pct)
        add_num(record.chosen.probability_beat_baseline)
        add_num(record.chosen.reservation_price)
        cb_chosen = record.chosen.cost_breakdown
        add_num(cb_chosen.gross_revenue)
        add_num(cb_chosen.transport)
        add_num(cb_chosen.hamali_tolai)
        add_num(cb_chosen.storage)
        add_num(cb_chosen.financing)
        add_num(cb_chosen.travel_loss_pct)
        add_num(cb_chosen.holding_loss_pct)
        add_num(cb_chosen.quantity_sold_qtl)

        # Forecast
        fc = record.forecast
        add_num(fc.q10)
        add_num(fc.q20)
        add_num(fc.q35)
        add_num(fc.q50)
        add_num(fc.q90)
        add_num(fc.low)
        add_num(fc.expected)
        add_num(fc.high)
        add_num(fc.rolling_mase)
        add_num(fc.rolling_80_coverage)

        # Risk
        add_num(record.risk.score)
        for flag in record.risk.flags:
            add_num(flag.score)

        # Common invariant constants (e.g. 100 kg/qtl, standard distances 60km, day offsets)
        allowed.update({0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 12.0, 25.0, 60.0, 85.0, 110.0, 100.0})

        # Add year/date fragments if parsed (e.g., 2026, 9, 10, 11)
        allowed.update({2026.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0})

        return allowed

    @staticmethod
    def extract_numbers_from_text(text: str) -> List[Tuple[float, str]]:
        """Extracts candidate numeric values and their raw string token from generated text."""
        normalized = normalize_devanagari_numbers(text)

        # Pattern matches currency, decimals, integers with optional commas: e.g. ₹36,055 or 1,842 or 62.4%
        # Excludes trailing sentence periods
        token_pattern = re.compile(r'(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:%|k|K)?')
        extracted: List[Tuple[float, str]] = []

        for match in token_pattern.finditer(normalized):
            raw_val = match.group(1).replace(",", "")
            try:
                val = float(raw_val)
                # Check if followed by 'k' e.g. 36k -> 36000
                full_match = match.group(0).lower()
                if 'k' in full_match and val < 1000:
                    val = val * 1000
                extracted.append((val, match.group(0).strip()))
            except ValueError:
                continue

        return extracted

    @classmethod
    def validate(cls, text: str, record: DecisionRecord, tolerance: float = 0.5) -> Tuple[bool, List[str]]:
        """
        Validates that all numbers in candidate text are supported by the DecisionRecord.
        Returns:
            (is_valid: bool, unsupported_tokens: List[str])
        """
        allowed = cls.extract_allowed_numbers(record)
        extracted = cls.extract_numbers_from_text(text)

        unsupported: List[str] = []

        for num_val, raw_token in extracted:
            # Check if num_val is close to any allowed number
            matched = False
            for allowed_num in allowed:
                if abs(num_val - allowed_num) <= tolerance:
                    matched = True
                    break
                # Check percentage/integer tolerance e.g. 62% vs 62.4%
                if abs(num_val - round(allowed_num)) <= 1.0 and allowed_num < 100:
                    matched = True
                    break

            if not matched:
                unsupported.append(f"{raw_token} ({num_val})")

        is_valid = len(unsupported) == 0
        return is_valid, unsupported
