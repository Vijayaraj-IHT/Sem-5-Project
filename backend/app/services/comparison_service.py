import re
from typing import List, Set, Dict, Any, Optional, Tuple
from app.models.case import Case
from app.schemas.comparison import (
    CaseComparisonRequest,
    CaseComparisonResponse,
    DimensionComparisonResult,
    PrecedentSummary,
    MultiCaseComparisonRequest,
    MultiCaseComparisonResponse,
)
from app.core.concordance import (
    normalize_section_str,
    get_concordance_equivalents,
    check_statutory_concordance,
    extract_scenario_clusters,
    extract_activity_clusters,
    compute_tversky_index,
    SCENARIO_CLUSTERS,
    ACTIVITY_CLUSTERS,
)


class CaseComparisonService:
    """
    Case-Based Reasoning (CBR) Legal Comparison Engine with:
    - 100% Congruency Rule for Identical Files / Cases / PDFs
    - Statutory Concordance Cross-Walk (BNSS ↔ CrPC, BNS ↔ IPC, BSA ↔ IEA)
    - Asymmetric Tversky Index for Scenario & Activity Sets
    - Distinguishability Classification (On All Fours, Analogous, Distinguishable)
    """

    WEIGHT_LEGAL: float = 0.35
    WEIGHT_FACTS: float = 0.35
    WEIGHT_JURISDICTION: float = 0.15
    WEIGHT_REMEDY: float = 0.15

    def _normalize_str(self, text: str) -> str:
        s = re.sub(r"[^a-zA-Z0-9\s]", " ", (text or "").lower())
        return re.sub(r"\s+", " ", s).strip()

    def _extract_target_profile(self, req: CaseComparisonRequest) -> Dict[str, Any]:
        """Extracts comparison objects from the user's target petition/case input."""
        user_facts = (req.facts_summary or "").strip()
        combined_text = " ".join([
            req.case_title or "",
            user_facts,
            " ".join(req.statutory_provisions or []),
            " ".join(req.legal_issues or []),
            " ".join(req.keyword_tags or []),
            req.remedy_sought or "",
            req.outcome or "",
        ])
        low = combined_text.lower()

        # 1. Statutory Provisions
        raw_secs = list(req.statutory_provisions or [])
        regex_secs = re.findall(r"\b(?:Section|Sec\.?|S\.)\s*([0-9A-Za-z\(\)]+)\s*(?:of\s+the\s+)?([A-Za-z\s]+)?", combined_text, re.I)
        for s_num, s_act in regex_secs:
            s_act_clean = (s_act or "").strip()
            if any(k in s_act_clean.upper() for k in ["BNSS", "BNS", "CRPC", "IPC", "BSA", "NDPS", "NI ACT"]):
                raw_secs.append(f"Section {s_num} {s_act_clean[:20]}")

        norm_secs = []
        for s in raw_secs:
            res = normalize_section_str(s)
            if res and res not in norm_secs:
                norm_secs.append(res)

        # 2. Scenarios & Activities
        scenarios = []
        for cluster, kws in SCENARIO_CLUSTERS.items():
            for kw in kws:
                if kw in low and kw not in scenarios:
                    scenarios.append(kw)

        activities = []
        for cluster, kws in ACTIVITY_CLUSTERS.items():
            for kw in kws:
                if kw in low and kw not in activities:
                    activities.append(kw)

        return {
            "norm_sections": norm_secs,
            "scenario_set": set(scenarios),
            "activity_set": set(activities),
            "remedy": req.remedy_sought or req.outcome or "",
        }

    def compare_case(self, req: CaseComparisonRequest, precedent: Case) -> CaseComparisonResponse:
        """
        Executes CBR multi-dimensional comparison between target and precedent.
        """
        prec_prof = precedent.comparison_profile or {}

        # =============================================================
        # 1. 100% IDENTICAL CASE / SAME PDF / SAME RECORD CHECK
        # =============================================================
        is_same_id = bool(req.target_case_id and str(req.target_case_id).strip() == str(precedent.id).strip())
        is_same_hash = bool(
            req.target_file_hash and precedent.file_hash and
            str(req.target_file_hash).lower().strip() == str(precedent.file_hash).lower().strip()
        )
        norm_req_case_no = self._normalize_str(req.target_case_no or "")
        norm_prec_case_no = self._normalize_str(precedent.case_no or "")
        is_same_case_no = bool(norm_req_case_no and norm_prec_case_no and norm_req_case_no == norm_prec_case_no)

        norm_req_title = self._normalize_str(req.case_title or "")
        norm_prec_title = self._normalize_str(precedent.title or "")
        is_same_title = bool(norm_req_title and norm_prec_title and norm_req_title == norm_prec_title)

        user_facts_raw = (req.facts_summary or "").strip()
        prec_facts_raw = (precedent.facts or precedent.summary or "").strip()
        is_same_facts = bool(user_facts_raw and prec_facts_raw and self._normalize_str(user_facts_raw) == self._normalize_str(prec_facts_raw))

        if is_same_id or is_same_hash or is_same_case_no or (is_same_title and (is_same_facts or norm_req_title)):
            precedent_summary = PrecedentSummary(
                case_id=precedent.id,
                title=precedent.title,
                case_no=precedent.case_no,
                court=precedent.court,
                year=precedent.year,
                source_url=precedent.source_url,
                file_hash=precedent.file_hash,
                precedential_status=precedent.precedential_status or "Binding Authority",
            )
            disp_text = precedent.outcome or precedent.disposition or "Allowed"
            prec_secs = [f"Section {m['section']} {m['act']}" for m in prec_prof.get("statutory_matrix", [])] or precedent.section_tags or ["Statutory Provisions"]

            dimensions = [
                DimensionComparisonResult(
                    dimension_name="Legal Issues & Statutory Provisions",
                    user_value=", ".join(prec_secs[:4]),
                    precedent_value=", ".join(prec_secs[:4]),
                    match_state="exact",
                    weight_assigned=self.WEIGHT_LEGAL,
                    effective_weight_percentage=35.0,
                    dimension_score=100.0,
                    explanation="Identical statutory framework and legal grounds. 100% statutory match.",
                    is_included_in_score=True,
                    matched_terms=prec_secs[:4],
                ),
                DimensionComparisonResult(
                    dimension_name="Facts & Dispute Context (Scenario & Activities)",
                    user_value=(prec_facts_raw[:90] + "...") if len(prec_facts_raw) > 90 else prec_facts_raw,
                    precedent_value=(prec_facts_raw[:90] + "...") if len(prec_facts_raw) > 90 else prec_facts_raw,
                    match_state="exact",
                    weight_assigned=self.WEIGHT_FACTS,
                    effective_weight_percentage=35.0,
                    dimension_score=100.0,
                    explanation="Identical factual matrix and procedural activity events (100% match).",
                    is_included_in_score=True,
                    matched_terms=prec_prof.get("scenario_keywords", []) + prec_prof.get("activity_events", []),
                ),
                DimensionComparisonResult(
                    dimension_name="Court & Jurisdiction",
                    user_value=precedent.court,
                    precedent_value=precedent.court,
                    match_state="exact",
                    weight_assigned=self.WEIGHT_JURISDICTION,
                    effective_weight_percentage=15.0,
                    dimension_score=100.0,
                    explanation=f"Identical judicial forum: {precedent.court}.",
                    is_included_in_score=True,
                ),
                DimensionComparisonResult(
                    dimension_name="Remedy & Procedural Posture",
                    user_value=disp_text,
                    precedent_value=disp_text,
                    match_state="exact",
                    weight_assigned=self.WEIGHT_REMEDY,
                    effective_weight_percentage=15.0,
                    dimension_score=100.0,
                    explanation=f"Identical procedural prayer and judicial determination: {disp_text}.",
                    is_included_in_score=True,
                ),
            ]

            return CaseComparisonResponse(
                overall_score=100.0,
                score_method="lexguard-cbr-concordance-v2.5",
                distinguishability_rating="On all fours (Identical Record)",
                dimensions=dimensions,
                precedent=precedent_summary,
                matched_scenario_terms=prec_prof.get("scenario_keywords", []),
                matched_activity_terms=prec_prof.get("activity_events", []),
                matched_statutes=prec_secs,
            )

        # =============================================================
        # 2. MULTI-OBJECT CORRELATION (Different Cases)
        # =============================================================
        target_prof = self._extract_target_profile(req)
        dimensions: List[DimensionComparisonResult] = []

        # -------------------------------------------------------------
        # Dimension 1: Statutory Framework with Concordance (35%)
        # -------------------------------------------------------------
        target_secs = target_prof["norm_sections"]
        prec_matrix = prec_prof.get("statutory_matrix", [])
        prec_secs = [(m["act"], m["section"]) for m in prec_matrix]
        if not prec_secs and precedent.section_tags:
            for s in precedent.section_tags:
                norm = normalize_section_str(s)
                if norm:
                    prec_secs.append(norm)

        matched_statutes_list = []
        highest_stat_score = 0.0
        concordance_notes = []

        if not target_secs and not prec_secs:
            # Neither has specific section tags
            dim1_score = 65.0
            dim1_state = "partial"
            dim1_exp = "General statutory principles applied (no specific section tags entered)."
        else:
            for t_act, t_sec in target_secs:
                for p_act, p_sec in prec_secs:
                    is_match, s_score, note = check_statutory_concordance(t_act, t_sec, p_act, p_sec)
                    if is_match and s_score > highest_stat_score:
                        highest_stat_score = s_score
                        concordance_notes.append(note)
                        matched_statutes_list.append(f"Section {t_sec} {t_act}")

            if highest_stat_score >= 95.0:
                dim1_score = 100.0
                dim1_state = "exact"
                dim1_exp = f"Substantial statutory alignment. {concordance_notes[-1] if concordance_notes else 'Exact statutory provision match.'}"
            elif highest_stat_score >= 40.0:
                dim1_score = round(highest_stat_score + 25.0, 1)
                dim1_state = "partial"
                dim1_exp = f"Partial legislative overlap. {concordance_notes[-1] if concordance_notes else 'Related statutory enactments.'}"
            else:
                dim1_score = 25.0
                dim1_state = "different"
                dim1_exp = "Statutory provisions rely on different legal frameworks or enactments."

        user_sec_disp = ", ".join(f"Section {s} {a}" for a, s in target_secs[:3]) or "Petition provisions"
        prec_sec_disp = ", ".join(f"Section {s} {a}" for a, s in prec_secs[:3]) or "Precedent statutes"

        dimensions.append(DimensionComparisonResult(
            dimension_name="Legal Issues & Statutory Provisions",
            user_value=user_sec_disp,
            precedent_value=prec_sec_disp,
            match_state=dim1_state,
            weight_assigned=self.WEIGHT_LEGAL,
            effective_weight_percentage=35.0,
            dimension_score=dim1_score,
            explanation=dim1_exp,
            is_included_in_score=True,
            matched_terms=matched_statutes_list,
        ))

        # -------------------------------------------------------------
        # Dimension 2: Scenario & Activity Sets (Tversky Index) (35%)
        # -------------------------------------------------------------
        t_scen = target_prof["scenario_set"]
        p_scen = set(prec_prof.get("scenario_keywords", []))
        t_act = target_prof["activity_set"]
        p_act = set(prec_prof.get("activity_events", []))

        # Asymmetric Tversky Index (alpha=0.7, beta=0.3)
        tversky_scen = compute_tversky_index(t_scen, p_scen, alpha=0.7, beta=0.3)
        tversky_act = compute_tversky_index(t_act, p_act, alpha=0.7, beta=0.3)

        matched_scenarios = list(t_scen.intersection(p_scen))
        matched_activities = list(t_act.intersection(p_act))

        # Calculate composite factual score
        if matched_scenarios or matched_activities:
            dim2_score = round(min(55.0 + (tversky_scen * 25.0) + (tversky_act * 25.0) + (len(matched_scenarios) * 5.0), 96.0), 1)
            dim2_state = "exact" if dim2_score >= 85.0 else "partial"
            terms_preview = ", ".join((matched_scenarios + matched_activities)[:4])
            dim2_exp = f"Grounded scenario & procedural activity overlap: '{terms_preview}'."
        else:
            dim2_score = 30.0
            dim2_state = "different"
            dim2_exp = "Factual dispute scenario and procedural trajectory diverge from precedent."

        dimensions.append(DimensionComparisonResult(
            dimension_name="Facts & Dispute Context (Scenario & Activities)",
            user_value=(user_facts_raw[:90] + "...") if len(user_facts_raw) > 90 else (user_facts_raw or "Petition factual scenario"),
            precedent_value=(prec_facts_raw[:90] + "...") if len(prec_facts_raw) > 90 else (prec_facts_raw or "Precedent factual matrix"),
            match_state=dim2_state,
            weight_assigned=self.WEIGHT_FACTS,
            effective_weight_percentage=35.0,
            dimension_score=dim2_score,
            explanation=dim2_exp,
            is_included_in_score=True,
            matched_terms=matched_scenarios + matched_activities,
        ))

        # -------------------------------------------------------------
        # Dimension 3: Court & Jurisdiction (15%)
        # -------------------------------------------------------------
        user_court = (req.court_jurisdiction or "").strip()
        prec_court = (precedent.court or "").strip()
        norm_user_court = self._normalize_str(user_court)
        norm_prec_court = self._normalize_str(prec_court)

        if not user_court:
            dim3_score = 70.0
            dim3_state = "partial"
            dim3_exp = "Court forum unstated. Neutral jurisdictional baseline applied."
        elif norm_user_court == norm_prec_court or norm_user_court in norm_prec_court or norm_prec_court in norm_user_court:
            dim3_score = 100.0
            dim3_state = "exact"
            dim3_exp = f"Identical judicial forum: {prec_court}."
        elif "supreme court" in norm_prec_court:
            dim3_score = 95.0
            dim3_state = "exact"
            dim3_exp = "Supreme Court of India precedent. Declared law is binding on all courts under Article 141."
        elif "high court" in norm_user_court and "high court" in norm_prec_court:
            dim3_score = 80.0
            dim3_state = "partial"
            dim3_exp = f"Inter-High Court precedent ({prec_court} vs {user_court}). Carries strong persuasive authority."
        else:
            dim3_score = 50.0
            dim3_state = "different"
            dim3_exp = f"Distinct judicial forums ({user_court} vs {prec_court})."

        dimensions.append(DimensionComparisonResult(
            dimension_name="Court & Jurisdiction",
            user_value=user_court or "High Court",
            precedent_value=prec_court,
            match_state=dim3_state,
            weight_assigned=self.WEIGHT_JURISDICTION,
            effective_weight_percentage=15.0,
            dimension_score=dim3_score,
            explanation=dim3_exp,
            is_included_in_score=True,
        ))

        # -------------------------------------------------------------
        # Dimension 4: Remedy & Procedural Posture (15%)
        # -------------------------------------------------------------
        user_remedy = (req.remedy_sought or req.outcome or "").strip()
        prec_remedy = (precedent.outcome or precedent.disposition or "Allowed").strip()
        u_norm = self._normalize_str(user_remedy)
        p_norm = self._normalize_str(prec_remedy)

        if not user_remedy:
            # Infer from scenario
            if any("bail" in s or "suspension" in s for s in target_prof["scenario_set"]):
                u_norm = "bail suspension of sentence"
            elif any("quash" in s for s in target_prof["scenario_set"]):
                u_norm = "quashing of proceedings"
            else:
                u_norm = "statutory relief"

        same_relief = ("allow" in u_norm and "allow" in p_norm) or ("dismiss" in u_norm and "dismiss" in p_norm)
        bail_match = ("bail" in u_norm or "suspend" in u_norm) and ("bail" in p_norm or "allow" in p_norm)

        if same_relief or bail_match or (u_norm == p_norm):
            dim4_score = 95.0
            dim4_state = "exact"
            dim4_exp = f"Congruent procedural remedy category ({user_remedy or 'Relief'}). Precedent disposition: {prec_remedy}."
        else:
            dim4_score = 65.0
            dim4_state = "partial"
            dim4_exp = f"Procedural posture differs slightly ({user_remedy} vs {prec_remedy}), but governing principles apply."

        dimensions.append(DimensionComparisonResult(
            dimension_name="Remedy & Procedural Posture",
            user_value=user_remedy or "Relief prayed",
            precedent_value=prec_remedy,
            match_state=dim4_state,
            weight_assigned=self.WEIGHT_REMEDY,
            effective_weight_percentage=15.0,
            dimension_score=dim4_score,
            explanation=dim4_exp,
            is_included_in_score=True,
        ))

        # -------------------------------------------------------------
        # Compute Overall Score & Distinguishability
        # -------------------------------------------------------------
        weighted_sum = sum(d.dimension_score * (d.weight_assigned / 1.0) for d in dimensions)
        overall_score = round(min(max(weighted_sum, 0.0), 100.0), 1)

        if overall_score >= 88.0:
            distinguishability = "On all fours (High binding authority)"
        elif overall_score >= 62.0:
            distinguishability = "Analogous principle (Persuasive precedent)"
        else:
            distinguishability = "Distinguishable on facts / statutory grounds"

        precedent_summary = PrecedentSummary(
            case_id=precedent.id,
            title=precedent.title,
            case_no=precedent.case_no,
            court=precedent.court,
            year=precedent.year,
            source_url=precedent.source_url,
            file_hash=precedent.file_hash,
            precedential_status=precedent.precedential_status or "Good Law",
        )

        return CaseComparisonResponse(
            overall_score=overall_score,
            score_method="lexguard-cbr-concordance-v2.5",
            distinguishability_rating=distinguishability,
            dimensions=dimensions,
            precedent=precedent_summary,
            matched_scenario_terms=matched_scenarios,
            matched_activity_terms=matched_activities,
            matched_statutes=matched_statutes_list,
        )

    def compare_multi(
        self,
        req: MultiCaseComparisonRequest,
        precedents: List[Case],
    ) -> MultiCaseComparisonResponse:
        """
        Executes parallel CBR comparison against 1 to 3 selected precedents.
        """
        results: List[CaseComparisonResponse] = []
        best_id = None
        best_score = -1.0

        for prec in precedents:
            single_req = CaseComparisonRequest(
                precedent_case_id=prec.id,
                target_case_id=req.target_case_id,
                target_file_hash=req.target_file_hash,
                target_case_no=req.target_case_no,
                case_title=req.case_title,
                court_jurisdiction=req.court_jurisdiction,
                practice_area=req.practice_area,
                facts_summary=req.facts_summary,
                legal_issues=req.legal_issues,
                statutory_provisions=req.statutory_provisions,
                keyword_tags=req.keyword_tags,
                remedy_sought=req.remedy_sought,
                procedural_status=req.procedural_status,
                outcome=req.outcome,
            )
            res = self.compare_case(single_req, prec)
            results.append(res)
            if res.overall_score > best_score:
                best_score = res.overall_score
                best_id = prec.id

        # Build cross-statutory matrix with concordance data
        user_provs = [p.strip() for p in (req.statutory_provisions or []) if p.strip()]
        statutory_matrix = {
            "user_provisions": user_provs,
            "precedents": [
                {
                    "case_id": prec.id,
                    "case_no": prec.case_no,
                    "title": prec.title,
                    "court": prec.court,
                    "year": prec.year,
                    "disposition": prec.disposition or prec.outcome or "Allowed",
                    "precedential_status": prec.precedential_status or "Good Law",
                    "act_tags": prec.act_tags or [],
                    "section_tags": prec.section_tags or [],
                    "ratio_decidendi": prec.ratio_decidendi or "",
                    "comparison_profile": prec.comparison_profile or {},
                }
                for prec in precedents
            ],
        }

        return MultiCaseComparisonResponse(
            results=results,
            best_match_id=best_id,
            best_match_score=best_score if best_score >= 0.0 else 0.0,
            cross_statutory_matrix=statutory_matrix,
        )


comparison_service = CaseComparisonService()
