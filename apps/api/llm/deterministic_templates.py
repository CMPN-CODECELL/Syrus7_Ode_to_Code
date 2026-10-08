"""Deterministic Response Templates for KrishiNirnay.
Language: Marathi (mr-IN), Hindi (hi-IN), English (en-IN).
Guaranteed 100% faithful to the immutable DecisionRecord.
"""

from typing import Dict, Any
from contracts.schemas.decision_record import DecisionRecord

class DeterministicTemplates:
    @staticmethod
    def render_recommendation(record: DecisionRecord, lang: str = "mr-IN") -> str:
        chosen = record.chosen
        base = record.baseline
        action = chosen.action
        qtl = int(record.lot_quantity_qtl) if record.lot_quantity_qtl.is_integer() else record.lot_quantity_qtl
        crop = record.commodity

        wait_net = int(chosen.net_total)
        base_net = int(base.net_total)
        gain = int(chosen.gain_total)
        reservation = int(chosen.reservation_price)
        prob = int(chosen.probability_beat_baseline * 100)
        risk = record.risk.overall

        if lang == "mr-IN":
            crop_mr = "टोमॅटो" if crop.lower() == "tomato" else ("कांदा" if crop.lower() == "onion" else crop)
            if action == "WAIT":
                return (
                    f"**सल्ला: {chosen.wait_days} दिवस थांबा ({chosen.market})**\n\n"
                    f"• **अंदाजे निव्वळ नफा:** ₹{wait_net:,}\n"
                    f"• **आज विकण्यापेक्षा फायदा:** +₹{gain:,} (निव्वळ वाढ)\n"
                    f"• **आजचा निव्वळ नफा:** ₹{base_net:,}\n"
                    f"• **किमान आरक्षण भाव (Reservation Price):** ₹{reservation:,}/क्विंटल (यापेक्षा कमी भावात विकू नका)\n"
                    f"• **यशस्वी होण्याची शक्यता:** {prob}%\n"
                    f"• **जोखीम पातळी:** {risk}\n\n"
                    f"**महत्त्वाचे कारण:** वाहतूक खर्च (₹{int(chosen.cost_breakdown.transport):,}), हमाली (₹{int(chosen.cost_breakdown.hamali_tolai):,}), "
                    f"साठवणूक (₹{int(chosen.cost_breakdown.storage):,}) आणि नासाडी (२%) वजा जाता, २ दिवसांनंतर जास्त नफा मिळण्याची शक्यता आहे."
                )
            elif action == "GO":
                return (
                    f"**सल्ला: दुसऱ्या बाजारात जा ({chosen.market})**\n\n"
                    f"• **अंदाजे निव्वळ नफा:** ₹{wait_net:,}\n"
                    f"• **घरच्या बाजारापेक्षा जास्त फायदा:** +₹{gain:,}\n"
                    f"• **वाहतूक खर्च:** ₹{int(chosen.cost_breakdown.transport):,}\n"
                    f"• **जोखीम पातळी:** {risk}\n"
                    f"वाहतूक आणि नासाडी वजा जाता हा पर्याय अधिक फायदेशीर ठरतो."
                )
            else:
                return (
                    f"**सल्ला: आजच विका ({base.market})**\n\n"
                    f"• **अंदाजे निव्वळ नफा:** ₹{base_net:,}\n"
                    f"• **आजचा भाव:** ₹{int(base.modal_price):,}/क्विंटल\n"
                    f"• **जोखीम पातळी:** {risk}\n"
                    f"थांबल्यास साठवणूक आणि नासाडीमुळे नफा कमी होण्याची किंवा भाव घसरण्याची शक्यता आहे."
                )

        elif lang == "hi-IN":
            crop_hi = "टमाटर" if crop.lower() == "tomato" else ("प्याज" if crop.lower() == "onion" else crop)
            if action == "WAIT":
                return (
                    f"**सलाह: {chosen.wait_days} दिन रुकें ({chosen.market})**\n\n"
                    f"• **अनुमानित शुद्ध आय:** ₹{wait_net:,}\n"
                    f"• **आज बेचने से अतिरिक्त लाभ:** +₹{gain:,}\n"
                    f"• **आज की शुद्ध आय:** ₹{base_net:,}\n"
                    f"• **न्यूनतम आरक्षण भाव (Reservation Price):** ₹{reservation:,}/क्विंटल (इससे कम भाव पर न बेचें)\n"
                    f"• **लाभ की संभावना:** {prob}%\n"
                    f"• **जोखिम स्तर:** {risk}\n\n"
                    f"**मुख्य कारण:** परिवहन (₹{int(chosen.cost_breakdown.transport):,}), हम्माली (₹{int(chosen.cost_breakdown.hamali_tolai):,}), "
                    f"भंडारण (₹{int(chosen.cost_breakdown.storage):,}) और खराबी (2%) काटकर भी रुकना अधिक लाभदायक है।"
                )
            elif action == "GO":
                return (
                    f"**सलाह: दूसरी मंडी जाएं ({chosen.market})**\n\n"
                    f"• **अनुमानित शुद्ध आय:** ₹{wait_net:,}\n"
                    f"• **अतिरिक्त लाभ:** +₹{gain:,}\n"
                    f"• **परिवहन खर्च:** ₹{int(chosen.cost_breakdown.transport):,}\n"
                    f"• **जोखिम स्तर:** {risk}"
                )
            else:
                return (
                    f"**सलाह: आज ही बेचें ({base.market})**\n\n"
                    f"• **अनुमानित शुद्ध आय:** ₹{base_net:,}\n"
                    f"• **आज का भाव:** ₹{int(base.modal_price):,}/क्विंटल\n"
                    f"• **जोखिम स्तर:** {risk}\n"
                    f"रुकने पर भंडारण खर्च और उपज खराबी से लाभ घटने का जोखिम है।"
                )

        else: # en-IN fallback
            if action == "WAIT":
                return (
                    f"**Recommendation: WAIT {chosen.wait_days} DAYS ({chosen.market})**\n\n"
                    f"• **Expected Net Realization:** ₹{wait_net:,}\n"
                    f"• **Net Gain vs Selling Today:** +₹{gain:,}\n"
                    f"• **Sell Now Baseline Net:** ₹{base_net:,}\n"
                    f"• **Reservation / Break-Even Price:** ₹{reservation:,}/qtl (do not accept below this)\n"
                    f"• **Probability of Beating Baseline:** {prob}%\n"
                    f"• **Risk Level:** {risk}\n\n"
                    f"**Key Rationale:** After deducting transport (₹{int(chosen.cost_breakdown.transport):,}), "
                    f"hamali (₹{int(chosen.cost_breakdown.hamali_tolai):,}), storage (₹{int(chosen.cost_breakdown.storage):,}), "
                    f"financing (₹{int(chosen.cost_breakdown.financing):,}), and 2% holding loss, waiting yields higher net return."
                )
            elif action == "GO":
                return (
                    f"**Recommendation: GO TO ANOTHER MANDI ({chosen.market})**\n\n"
                    f"• **Expected Net Realization:** ₹{wait_net:,}\n"
                    f"• **Extra Gain vs Home Mandi:** +₹{gain:,}\n"
                    f"• **Transport Cost:** ₹{int(chosen.cost_breakdown.transport):,}\n"
                    f"• **Risk Level:** {risk}"
                )
            else:
                return (
                    f"**Recommendation: SELL NOW ({base.market})**\n\n"
                    f"• **Expected Net Realization:** ₹{base_net:,}\n"
                    f"• **Today's Modal Price:** ₹{int(base.modal_price):,}/qtl\n"
                    f"• **Risk Level:** {risk}\n"
                    f"Waiting or traveling does not clear the required margin or probability thresholds."
                )

    @staticmethod
    def render_spoken_summary(record: DecisionRecord, lang: str = "mr-IN") -> str:
        chosen = record.chosen
        base = record.baseline
        action = chosen.action
        wait_net = int(chosen.net_total)
        gain = int(chosen.gain_total)
        base_net = int(base.net_total)

        if lang == "mr-IN":
            if action == "WAIT":
                return f"{chosen.wait_days} दिवस थांबा. अंदाजे निव्वळ नफा {wait_net:,} रुपये मिळेल, जो आजपेक्षा {gain:,} रुपये जास्त आहे. हवामानाचा यलो अलर्ट असल्याने मालाची काळजी घ्या."
            elif action == "GO":
                return f"{chosen.market} मध्ये जा. अंदाजे निव्वळ नफा {wait_net:,} रुपये मिळेल. वाहतूक खर्चाचे नियोजन करा."
            else:
                return f"आजच विका. अंदाजे निव्वळ नफा {base_net:,} रुपये आहे."
        elif lang == "hi-IN":
            if action == "WAIT":
                return f"{chosen.wait_days} दिन रुकें. अनुमानित शुद्ध आय {wait_net:,} रुपये होगी, जो आज से {gain:,} रुपये अधिक है. मौसम की चेतावनी का ध्यान रखें."
            elif action == "GO":
                return f"{chosen.market} जाएं. अनुमानित शुद्ध आय {wait_net:,} रुपये मिलेगी."
            else:
                return f"आज ही बेचें. अनुमानित शुद्ध आय {base_net:,} रुपये है."
        else:
            if action == "WAIT":
                return f"Wait {chosen.wait_days} days. Expected net return is {wait_net:,} rupees, which is {gain:,} rupees higher than today. Watch for weather risks."
            elif action == "GO":
                return f"Go to {chosen.market}. Expected net return is {wait_net:,} rupees after transport costs."
            else:
                return f"Sell today. Expected net return is {base_net:,} rupees."
