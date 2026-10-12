#!/usr/bin/env python3
"""
Validate optimized ADLC generated artifacts.

This validator intentionally checks structure, required sections, ID presence,
and traceability hygiene. It does not attempt to judge business correctness.
"""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path


ARTIFACTS = {
    "00": "00_Project_Intake_And_Mode.md",
    "01": "01_Source_Baseline.md",
    "02": "02_Requirements_And_Scope.md",
    "03": "03_Current_State_Analysis.md",
    "04": "04_Target_Solution_Architecture.md",
    "05": "05_Technology_Engineering_And_Design.md",
    "06": "06_Backlog_Delivery_And_Migration_Plan.md",
    "07": "07_Quality_Test_And_Validation.md",
    "08": "08_Release_Operations_And_Governance.md",
    "09": "09_Build_Prompt.md",
}

REPORT_NAME = "10_ADLC_Validation_Report.md"

REQUIRED_BY_MODE = {
    "forward_engineering": ["00", "01", "02", "04", "05", "06", "07", "08", "09"],
    "reverse_engineering_only": ["00", "01", "03", "07", "08"],
    "reverse_to_forward_engineering": ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09"],
    "enhancement": ["00", "01", "02", "04", "05", "06", "07", "08", "09"],
    "migration_modernization": ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09"],
}

REQUIRED_SECTIONS = {
    "00": [
        "Metadata",
        "Purpose",
        "Project Classification",
        "Auto-Detection Rules",
        "Source Folder Inventory",
        "Stakeholders And Ownership",
        "Applicability Matrix",
        "Tool And Integration Targets",
        "Open Questions And Blockers",
    ],
    "01": [
        "Metadata",
        "Purpose",
        "Consolidated Source Inventory",
        "Auto-Classification Summary",
        "Source Version Register",
        "Post-Generation Source Change Log",
        "Changed Source Impact Summary",
        "Regeneration Decision Matrix",
        "Source Precedence And Conflict Rules",
        "Source Conflict Register",
        "Source Coverage Map",
    ],
    "02": [
        "Metadata",
        "Purpose",
        "Project Overview",
        "User Personas",
        "Scope",
        "Functional Requirements",
        "Non-Functional Requirements",
        "Workflow And Flow Summary",
        "Detailed Flow Rules",
        "Business Rules And Decisions",
        "Assumptions Constraints And Open Questions",
    ],
    "03": [
        "Metadata",
        "Purpose",
        "Codebase Analysis Depth And Confidence",
        "Language Framework And Runtime Detection",
        "Codebase Source Inventory",
        "Repository Project And Module Inventory",
        "Entrypoint Route Controller And Service Inventory",
        "Package Dependency Manifest Inventory",
        "Current API Interface Job And Integration Inventory",
        "Current Data And Persistence Inventory",
        "Runtime Operations And Deployment Inventory",
        "Deployment Runtime And Test Evidence Matrix",
        "Test Quality Security And Technical Debt Assessment",
        "As-Is To Target Candidate Mapping",
    ],
    "04": [
        "Metadata",
        "Purpose",
        "Executive Summary",
        "Architecture Views",
        "Diagram-Ready Architecture Inventory",
        "Component Architecture",
        "Integration Architecture",
        "Data Architecture And Governance",
        "Security Privacy And Compliance Architecture",
        "Scalability Resilience And Operations",
        "Architecture Decisions",
    ],
    "05": [
        "Metadata",
        "Purpose",
        "Technology Source Inventory",
        "Target Technology Stack",
        "Project Structure And Repository Hygiene",
        "Naming Conventions",
        "Authentication Authorization And Configuration",
        "Engineering Standards",
        "UI Screen And Control Inventory",
        "Design System",
        "DevSecOps And Tooling",
    ],
    "06": [
        "Metadata",
        "Purpose",
        "Backlog Hierarchy",
        "Backlog Intake Prioritization And Review Criteria",
        "Migration And Transition Plan",
        "Retained Replaced Retired Component Summary",
        "Migration Cutover And Reconciliation Strategy",
        "Data Migration Reconciliation Checklist",
        "Delivery Phases And Milestones",
        "Dependencies And Sequencing",
        "Estimation Capacity And Forecast",
        "Delivery Risks And Open Questions",
    ],
    "07": [
        "Metadata",
        "Purpose",
        "Quality Gate Thresholds By Tier",
        "Minimum Required Tests By Mode",
        "Implementation Unit And Test Strategy",
        "Requirement Traceability And Coverage",
        "Measurable NFR Acceptance Matrix",
        "Evidence And Scan Validation Matrix",
        "Regression Test Suite",
        "Build Prompt Validation",
        "Enterprise Readiness Score",
        "Quality Gate Decision",
    ],
    "08": [
        "Metadata",
        "Purpose",
        "Release Notes",
        "Release Scope And Readiness",
        "Environment Configuration And Deployment Readiness",
        "Source Control Build And Release Baseline",
        "Deployment Rollback And Communication",
        "Production Readiness Checklist",
        "Operational Readiness",
        "Support Model And Incident Operations",
        "Governance Baseline And Ownership",
        "Source Change Control Register",
        "Regeneration And Baseline Approval",
        "Approval Gates",
        "Build Orchestration Governance",
        "Compliance And Audit Evidence",
    ],
    "09": [
        "Metadata",
        "Purpose",
        "Validation Preconditions",
        "Do Not Build If",
        "Source Artifact Baseline",
        "Build Orchestration Handshake",
        "Agent Role And Ownership Matrix",
        "Shared File And Conflict Protocol",
        "Session Handoff Contract",
        "Build Wave Plan",
        "Integration And Acceptance Gates",
        "Build Scope And Non-Goals",
        "Mandatory Tech Stack",
        "Project Structure",
        "Data Model And Migration",
        "Migration-Specific Build Constraints",
        "API Endpoints Integrations And Jobs",
        "Implementation Order",
        "Testing And Validation Requirements",
        "Generation Rules",
        "Delivery Report Requirements",
    ],
}

MODE_ALIASES = {
    "forward engineering": "forward_engineering",
    "forward_engineering": "forward_engineering",
    "greenfield": "forward_engineering",
    "reverse engineering only": "reverse_engineering_only",
    "reverse_engineering_only": "reverse_engineering_only",
    "reverse-to-forward engineering": "reverse_to_forward_engineering",
    "reverse_to_forward_engineering": "reverse_to_forward_engineering",
    "reverse-to-forward": "reverse_to_forward_engineering",
    "migration": "migration_modernization",
    "modernization": "migration_modernization",
    "migration_modernization": "migration_modernization",
    "enhancement": "enhancement",
}

ENTERPRISE_TIERS = {"enterprise", "regulated"}

DOMAIN_VALUES = {"software", "data_and_analytics"}

SUBTYPE_VALUES = {
    "data_pipeline_etl",
    "data_warehouse_lakehouse",
    "bi_reporting_analytics",
    "data_migration",
    "data_governance_quality_mdm",
}

BUILD_TARGET_VALUES = {
    "application_code",
    "data_pipeline",
    "ml_training_pipeline",
    "bi_semantic_model_and_dashboards",
    "mixed",
}


@dataclass
class Finding:
    severity: str
    check_id: str
    artifact: str
    message: str


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def detect_mode(texts: dict[str, str], explicit: str | None) -> str:
    if explicit:
        key = normalize(explicit)
        return MODE_ALIASES.get(key, key)

    combined_metadata = "\n".join(texts.values())
    metadata_match = re.search(r"^\s*-\s*Execution_Mode:\s*(.+?)\s*$", combined_metadata, re.MULTILINE | re.IGNORECASE)
    if metadata_match:
        value = metadata_match.group(1).strip("{} ")
        key = normalize(value)
        if key in MODE_ALIASES:
            return MODE_ALIASES[key]
        if key:
            return key

    intake = texts.get("00", "")
    for raw, canonical in MODE_ALIASES.items():
        if raw.lower() in intake.lower():
            return canonical

    combined = "\n".join(texts.values()).lower()
    if "reverse_to_forward" in combined or "reverse-to-forward" in combined:
        return "reverse_to_forward_engineering"
    if "migration" in combined or "modernization" in combined:
        return "migration_modernization"
    if "reverse engineering only" in combined:
        return "reverse_engineering_only"
    return "forward_engineering"


def detect_tier(texts: dict[str, str], explicit: str | None) -> str:
    if explicit:
        return normalize(explicit)

    combined_metadata = "\n".join(texts.values())
    metadata_match = re.search(r"^\s*-\s*Delivery_Tier:\s*(.+?)\s*$", combined_metadata, re.MULTILINE | re.IGNORECASE)
    if metadata_match:
        value = normalize(metadata_match.group(1).strip("{} "))
        if value in {"lite", "standard", "enterprise", "regulated"}:
            return value

    intake = texts.get("00", "").lower()
    for tier in ("regulated", "enterprise", "standard", "lite"):
        if tier in intake:
            return tier
    return "standard"


def detect_domain(texts: dict[str, str], explicit: str | None) -> str:
    if explicit:
        key = normalize(explicit)
        return key if key in DOMAIN_VALUES else "software"

    combined_metadata = "\n".join(texts.values())
    metadata_match = re.search(r"^\s*-\s*Domain:\s*(.+?)\s*$", combined_metadata, re.MULTILINE | re.IGNORECASE)
    if metadata_match:
        value = normalize(metadata_match.group(1).strip("{} "))
        if value in DOMAIN_VALUES:
            return value
    return "software"


def detect_subtype(texts: dict[str, str], explicit: str | None) -> set[str]:
    raw = explicit
    if not raw:
        combined_metadata = "\n".join(texts.values())
        metadata_match = re.search(
            r"^\s*-\s*Data_Analytics_Subtype:\s*(.+?)\s*$", combined_metadata, re.MULTILINE | re.IGNORECASE
        )
        if metadata_match:
            raw = metadata_match.group(1).strip("{} ")
    if not raw:
        return set()
    tokens = {normalize(token) for token in re.split(r"[,/|]", raw) if normalize(token)}
    return {token for token in tokens if token in SUBTYPE_VALUES}


def detect_dashboard_flag(texts: dict[str, str], explicit: bool | None) -> bool:
    if explicit is not None:
        return explicit
    combined_metadata = "\n".join(texts.values())
    metadata_match = re.search(
        r"^\s*-\s*Dashboard_Frontend_In_Scope:\s*(.+?)\s*$", combined_metadata, re.MULTILINE | re.IGNORECASE
    )
    if metadata_match:
        return normalize(metadata_match.group(1).strip("{} ")) == "yes"
    return False


def detect_build_target_type(texts: dict[str, str], explicit: str | None) -> str:
    if explicit:
        key = normalize(explicit)
        return key if key in BUILD_TARGET_VALUES else "application_code"

    text = texts.get("09", "")
    match = re.search(r"^\s*-\s*Build_Target_Type:\s*(.+?)\s*$", text, re.MULTILINE | re.IGNORECASE)
    if match:
        value = normalize(match.group(1).strip("{} "))
        if value in BUILD_TARGET_VALUES:
            return value
    return "application_code"


def resolve_required_sections(
    key: str,
    domain: str,
    subtypes: set[str],
    dashboard_in_scope: bool,
    build_target_type: str,
) -> list[str]:
    """Domain/Subtype-aware required-sections resolver.

    Software-domain behavior is unchanged from the original flat REQUIRED_SECTIONS
    dict; all branching below only fires when domain == "data_and_analytics".
    """
    sections = list(REQUIRED_SECTIONS.get(key, []))
    is_da = domain == "data_and_analytics"

    if key == "03" and is_da:
        if subtypes & {"data_pipeline_etl", "data_warehouse_lakehouse", "data_migration", "bi_reporting_analytics"}:
            sections.append("Data Pipeline And Orchestration Inventory")

    if key == "04" and is_da:
        if subtypes & {"data_pipeline_etl", "data_warehouse_lakehouse", "data_migration"}:
            sections.append("Data Pipeline And Storage Architecture")
        if "data_governance_quality_mdm" in subtypes:
            sections.append("Master Data Management Design")
        if subtypes & {"data_warehouse_lakehouse", "bi_reporting_analytics", "data_governance_quality_mdm"}:
            sections.append("Access Control And Masking Rules")
        if "bi_reporting_analytics" in subtypes:
            sections.append("BI Semantic Model And Metric Layer Architecture")

    if key == "05":
        ui_required = (not is_da) or ("bi_reporting_analytics" in subtypes and dashboard_in_scope)
        if not ui_required:
            sections = [s for s in sections if s not in ("UI Screen And Control Inventory", "Design System")]
        if is_da:
            if subtypes & {
                "data_pipeline_etl",
                "data_warehouse_lakehouse",
                "data_migration",
                "data_governance_quality_mdm",
            }:
                sections.append("Data Pipeline And Job Design Standards")
            if "bi_reporting_analytics" in subtypes:
                sections.append("BI Semantic Model And Dashboard Inventory")

    if key == "07" and is_da:
        sections.append("Data Quality Validation Matrix")
        if "bi_reporting_analytics" in subtypes:
            sections.append("BI Dashboard UAT And KPI Reconciliation")

    if key == "08" and is_da:
        sections.append("Data Governance Cadence And Stewardship")
        if subtypes & {"data_warehouse_lakehouse", "bi_reporting_analytics", "data_governance_quality_mdm"}:
            sections.append("Access Control And Masking Governance")

    if key == "09" and build_target_type != "application_code":
        sections.append("Data Pipeline And Model Build Specification")

    return sections


def has_section(text: str, section: str) -> bool:
    pattern = rf"^##\s+{re.escape(section)}\s*$"
    return re.search(pattern, text, re.MULTILINE | re.IGNORECASE) is not None


def extract_ids(text: str, prefix: str) -> set[str]:
    return set(re.findall(rf"\b{re.escape(prefix)}-\d+\b", text, flags=re.IGNORECASE))


def has_any(text: str, terms: list[str]) -> bool:
    lower = text.lower()
    return any(term.lower() in lower for term in terms)


def validate(
    generated_dir: Path,
    mode: str | None,
    tier: str | None,
    domain: str | None = None,
    subtype: str | None = None,
    dashboard_in_scope: bool | None = None,
    build_target_type: str | None = None,
) -> tuple[str, str, list[Finding]]:
    texts: dict[str, str] = {}
    findings: list[Finding] = []

    for key, filename in ARTIFACTS.items():
        path = generated_dir / filename
        if path.exists():
            texts[key] = read_text(path)

    detected_mode = detect_mode(texts, mode)
    detected_tier = detect_tier(texts, tier)
    detected_domain = detect_domain(texts, domain)
    detected_subtypes = detect_subtype(texts, subtype)
    detected_dashboard = detect_dashboard_flag(texts, dashboard_in_scope)
    detected_build_target = detect_build_target_type(texts, build_target_type)
    required_keys = REQUIRED_BY_MODE.get(detected_mode, REQUIRED_BY_MODE["forward_engineering"])

    for key in required_keys:
        filename = ARTIFACTS[key]
        if key not in texts:
            findings.append(Finding("Blocker", "ARTIFACT-MISSING", filename, "Required artifact is missing."))

    for key in required_keys:
        if key not in texts:
            continue
        filename = ARTIFACTS[key]
        resolved_sections = resolve_required_sections(
            key, detected_domain, detected_subtypes, detected_dashboard, detected_build_target
        )
        for section in resolved_sections:
            if not has_section(texts[key], section):
                findings.append(Finding("Blocker", "SECTION-MISSING", filename, f"Required section missing: {section}"))

    if detected_domain == "data_and_analytics" and detected_tier in ENTERPRISE_TIERS:
        # Evidence terms are content markers, not section headings — a bare heading with no
        # supporting evidence must not trivially satisfy these gates.
        da_enterprise_checks: list[tuple[str, str, list[str]]] = [
            ("07", "DA-DQ", ["Data_Quality_Threshold", "Dimension_Taxonomy"]),
            ("08", "DA-GOV", ["Stewardship_Owner", "Governance_Cadence"]),
        ]
        if "data_governance_quality_mdm" in detected_subtypes:
            da_enterprise_checks.append(("04", "DA-MDM", ["Golden_Record", "Survivorship_Rule"]))
        if detected_subtypes & {"data_warehouse_lakehouse", "bi_reporting_analytics", "data_governance_quality_mdm"}:
            da_enterprise_checks.append(("04", "DA-ACCESS", ["ABAC_Rule", "Masking_Rule"]))
        if "bi_reporting_analytics" in detected_subtypes:
            da_enterprise_checks.append(("08", "DA-BI", ["Refresh_Cadence", "Staleness_SLA"]))
        for key, check_id, terms in da_enterprise_checks:
            if key in required_keys and key in texts and not has_any(texts[key], terms):
                findings.append(
                    Finding("Blocker", check_id, ARTIFACTS[key], f"Missing Data & Analytics enterprise evidence: {', '.join(terms)}")
                )

    if "02" in texts:
        fr_ids = extract_ids(texts["02"], "FR")
        nfr_ids = extract_ids(texts["02"], "NFR")
        build_required = "09" in required_keys
        for fr_id in sorted(fr_ids):
            for key in ("06", "07"):
                if key in required_keys and key in texts and fr_id not in texts[key]:
                    findings.append(Finding("Blocker", "TRACE-FR", ARTIFACTS[key], f"{fr_id} is not referenced."))
            if build_required and "09" in texts and fr_id not in texts["09"]:
                findings.append(Finding("Blocker", "TRACE-FR", ARTIFACTS["09"], f"{fr_id} is not referenced in build prompt."))
        for nfr_id in sorted(nfr_ids):
            if "07" in texts and nfr_id not in texts["07"]:
                findings.append(Finding("Blocker", "TRACE-NFR", ARTIFACTS["07"], f"{nfr_id} is not referenced in validation."))

    if detected_tier in ENTERPRISE_TIERS:
        enterprise_checks = {
            "04": ["Threat model", "Security_Control", "Compliance"],
            "05": ["DevSecOps", "Security", "Secret"],
            "07": ["SecurityScan", "DependencyScan", "Evidence", "Enterprise Readiness"],
            "08": ["Production Readiness", "Compliance", "Audit", "Approval Gates", "Operational Readiness"],
        }
        for key, terms in enterprise_checks.items():
            if key in required_keys and key in texts and not has_any(texts[key], terms):
                findings.append(Finding("Blocker", "ENTERPRISE-GATE", ARTIFACTS[key], f"Missing enterprise evidence terms: {', '.join(terms)}"))

    reverse_modes = {"reverse_to_forward_engineering", "migration_modernization"}
    if detected_mode in reverse_modes:
        if "03" not in texts:
            findings.append(Finding("Blocker", "CURRENT-STATE-MISSING", ARTIFACTS["03"], "Current-state analysis is required."))
        if "06" in texts and not has_any(texts["06"], ["Rollback", "Fallback", "Reconciliation", "Cutover"]):
            findings.append(Finding("Blocker", "MIGRATION-GATE", ARTIFACTS["06"], "Migration plan must include rollback/fallback, reconciliation, and cutover evidence."))
        if "03" in texts and "06" in texts and not has_any(texts["03"], ["Retain", "Modernize", "Replace", "Retire", "Rebuild"]):
            findings.append(Finding("Warning", "TARGET-MAPPING", ARTIFACTS["03"], "Current-state treatment mapping may be incomplete."))

    if "09" in texts:
        blocker_terms = ["Open_Blocker", "Unresolved_Blocking", "Not_Ready", "Failed_Validation"]
        if has_any(texts["09"], blocker_terms):
            findings.append(Finding("Blocker", "BUILD-PROMPT-BLOCKER", ARTIFACTS["09"], "Build prompt contains blocker language."))
        if "10_ADLC_Validation_Report" not in texts["09"]:
            findings.append(Finding("Warning", "BUILD-PROMPT-VALIDATION", ARTIFACTS["09"], "Build prompt does not reference validation report."))
        orchestration_terms = [
            "Build Orchestration Handshake",
            "Agent Role And Ownership Matrix",
            "Shared File And Conflict Protocol",
            "Session Handoff Contract",
            "Integration And Acceptance Gates",
        ]
        if not all(term in texts["09"] for term in orchestration_terms):
            findings.append(Finding("Blocker", "BUILD-ORCHESTRATION", ARTIFACTS["09"], "Build prompt is missing multi-agent/multi-session orchestration handshake sections."))

    if "01" in texts:
        has_change_signal = has_any(texts["01"], ["Impact_Assessment_Needed", "Build_Prompt_Impact: Stale", "Current_Baseline_Status: Stale"])
        has_open_change = has_any(texts["01"], ["Impact_Assessment_Needed", "Build_Prompt_Impact: Stale", "Current_Baseline_Status: Stale"])
        if has_change_signal and has_open_change:
            if "10" not in texts:
                findings.append(Finding("Blocker", "SOURCE-CHANGE-VALIDATION", REPORT_NAME, "Source changes are present but validation report is missing."))
            if "09" in texts and not has_any(texts["09"], ["Source_Baseline_Status", "Open_Source_Change_IDs"]):
                findings.append(Finding("Blocker", "BUILD-PROMPT-STALE-CHECK", ARTIFACTS["09"], "Build prompt does not include source baseline freshness fields."))

    return detected_mode, detected_tier, findings


def render_report(mode: str, tier: str, findings: list[Finding]) -> str:
    blockers = [f for f in findings if f.severity.lower() == "blocker"]
    warnings = [f for f in findings if f.severity.lower() == "warning"]
    infos = [f for f in findings if f.severity.lower() == "info"]
    result = "Fail" if blockers else ("Conditional Pass" if warnings else "Pass")
    build_status = "Not Ready" if blockers else ("Conditional" if warnings else "Ready")

    lines = [
        "# ADLC Validation Report",
        "",
        "## Metadata",
        f"- Execution_Mode: {mode}",
        f"- Delivery_Tier: {tier}",
        "- Validation_Rules: ADLC_Artifact_Validation_Rules.md",
        "- Validator: scripts/validate_adlc_artifacts.py",
        "",
        "## Validation Summary",
        f"- Overall_Result: {result}",
        f"- Build_Prompt_Status: {build_status}",
        f"- Blocker_Count: {len(blockers)}",
        f"- Warning_Count: {len(warnings)}",
        f"- Info_Count: {len(infos)}",
        "",
        "## Findings",
        "| Severity | Check_ID | Artifact | Finding |",
        "|---|---|---|---|",
    ]
    if findings:
        for finding in findings:
            message = finding.message.replace("|", "/")
            lines.append(f"| {finding.severity} | {finding.check_id} | {finding.artifact} | {message} |")
    else:
        lines.append("| Info | NONE | All | No structural validation findings. |")

    lines.extend(
        [
            "",
            "## Build Prompt Approval Decision",
            f"- Build_Allowed: {'No' if blockers else ('Conditional' if warnings else 'Yes')}",
            f"- Approval_Basis: {result}",
            "- Required_Before_Build: Resolve all blockers and approve warnings/waivers as needed.",
            "",
        ]
    )
    return "\n".join(lines)


def write_report(generated_dir: Path, output: Path | None, mode: str, tier: str, findings: list[Finding]) -> Path:
    report = render_report(mode, tier, findings)
    output_path = output or (generated_dir / REPORT_NAME)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")
    return output_path


def create_artifact(folder: Path, filename: str, sections: list[str], extra: str = "") -> None:
    lines = [f"# {filename.removesuffix('.md')}", ""]
    for section in sections:
        lines.extend([f"## {section}", ""])
        if section == "Metadata":
            lines.extend(["- Execution_Mode: Forward_Engineering", "- Delivery_Tier: Enterprise", ""])
    if extra:
        lines.extend([extra, ""])
    (folder / filename).write_text("\n".join(lines), encoding="utf-8")


def run_self_test() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for key in ["00", "01", "02", "04", "05", "06", "07", "08", "09"]:
            extra = ""
            if key == "02":
                extra = "FR-001\nNFR-001\n"
            if key == "04":
                extra = "Threat model\nSecurity_Control\nCompliance\n"
            if key == "05":
                extra = "DevSecOps\nSecurity\nSecret\n"
            if key in {"06", "07", "09"}:
                extra = "FR-001\nNFR-001\n"
            if key == "07":
                extra += "SecurityScan\nDependencyScan\nEvidence\nEnterprise Readiness\n"
            if key == "08":
                extra = "Production Readiness\nCompliance\nAudit\nApproval Gates\nOperational Readiness\n"
            create_artifact(root, ARTIFACTS[key], REQUIRED_SECTIONS[key], extra)
        mode, tier, findings = validate(root, "forward_engineering", "enterprise")
        if any(f.severity == "Blocker" for f in findings):
            print("Self-test failed: expected greenfield sample to have no blockers.")
            for f in findings:
                print(f)
            return 1

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for key in ["00", "01", "02", "04", "05", "06", "07", "08", "09"]:
            create_artifact(root, ARTIFACTS[key], REQUIRED_SECTIONS.get(key, []))
        mode, tier, findings = validate(root, "reverse_to_forward_engineering", "enterprise")
        if not any(f.check_id == "ARTIFACT-MISSING" and f.artifact == ARTIFACTS["03"] for f in findings):
            print("Self-test failed: expected missing current-state analysis blocker.")
            return 1

    with tempfile.TemporaryDirectory() as tmp:
        # Data & Analytics / Data_Governance_Quality_MDM scenario: verifies (a) UI Screen And
        # Control Inventory / Design System are correctly absent from required sections when
        # Dashboard_Frontend_In_Scope is No, and (b) a Blocker fires when MDM stewardship
        # evidence is missing even though the section heading itself is present.
        root = Path(tmp)
        domain = "data_and_analytics"
        subtypes = {"data_governance_quality_mdm"}
        dashboard_in_scope = False
        build_target = "data_pipeline"

        resolved_05 = resolve_required_sections("05", domain, subtypes, dashboard_in_scope, build_target)
        if "UI Screen And Control Inventory" in resolved_05 or "Design System" in resolved_05:
            print("Self-test failed: UI/Design System should not be required for this scenario.")
            return 1

        for key in ["00", "01", "02", "04", "05", "06", "07", "08", "09"]:
            sections = resolve_required_sections(key, domain, subtypes, dashboard_in_scope, build_target)
            extra = ""
            if key == "02":
                extra = "FR-001\nNFR-001\n"
            if key == "04":
                extra = "Threat model\nSecurity_Control\nCompliance\n"
                # Deliberately omit Golden_Record/Survivorship_Rule evidence so DA-MDM fires.
                extra += "ABAC_Rule\nMasking_Rule\n"
            if key == "05":
                extra = "DevSecOps\nSecurity\nSecret\n"
            if key in {"06", "07", "09"}:
                extra = "FR-001\nNFR-001\n"
            if key == "07":
                extra += "SecurityScan\nDependencyScan\nEvidence\nEnterprise Readiness\nData_Quality_Threshold\nDimension_Taxonomy\n"
            if key == "08":
                extra = "Production Readiness\nCompliance\nAudit\nApproval Gates\nOperational Readiness\nStewardship_Owner\nGovernance_Cadence\n"
            create_artifact(root, ARTIFACTS[key], sections, extra)

        mode, tier, findings = validate(
            root, "forward_engineering", "enterprise", domain, ",".join(sorted(subtypes)), dashboard_in_scope, build_target
        )
        if not any(f.check_id == "DA-MDM" for f in findings):
            print("Self-test failed: expected DA-MDM blocker for missing MDM stewardship evidence.")
            for f in findings:
                print(f)
            return 1
        if any(f.check_id == "SECTION-MISSING" and "UI Screen" in f.message for f in findings):
            print("Self-test failed: UI Screen And Control Inventory should not have been checked.")
            return 1

    print("Self-test passed.")
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate optimized ADLC generated artifacts.")
    parser.add_argument("--generated-dir", default="Generated Artifacts", help="Path to generated ADLC artifacts.")
    parser.add_argument("--mode", default=None, help="Execution mode override.")
    parser.add_argument("--tier", default=None, help="Delivery tier override.")
    parser.add_argument("--domain", default=None, help="Domain override (software or data_and_analytics).")
    parser.add_argument("--subtype", default=None, help="Data_Analytics_Subtype override, comma-separated.")
    parser.add_argument(
        "--dashboard-in-scope",
        default=None,
        choices=["yes", "no"],
        help="Dashboard_Frontend_In_Scope override.",
    )
    parser.add_argument("--build-target-type", default=None, help="Build_Target_Type override for 09_Build_Prompt.md.")
    parser.add_argument("--output", default=None, help="Validation report output path.")
    parser.add_argument("--no-write", action="store_true", help="Print report to stdout instead of writing a file.")
    parser.add_argument("--self-test", action="store_true", help="Run built-in validator self-tests.")
    args = parser.parse_args(argv)

    if args.self_test:
        return run_self_test()

    generated_dir = Path(args.generated_dir)
    if not generated_dir.exists():
        print(f"Generated artifacts folder not found: {generated_dir}", file=sys.stderr)
        return 2

    dashboard_override = None if args.dashboard_in_scope is None else args.dashboard_in_scope == "yes"
    mode, tier, findings = validate(
        generated_dir,
        args.mode,
        args.tier,
        args.domain,
        args.subtype,
        dashboard_override,
        args.build_target_type,
    )
    if args.no_write:
        print(render_report(mode, tier, findings))
    else:
        output = Path(args.output) if args.output else None
        output_path = write_report(generated_dir, output, mode, tier, findings)
        print(f"Wrote validation report: {output_path}")

    return 1 if any(f.severity.lower() == "blocker" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
