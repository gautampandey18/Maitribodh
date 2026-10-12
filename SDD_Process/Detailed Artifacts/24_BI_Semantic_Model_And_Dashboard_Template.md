# BI Semantic Model And Dashboard Template

## Metadata
Instruction: Define the semantic/metric layer and dashboard inventory so BI delivery has a documented single source of truth, the same way `14_Design_System_Template.md` does for visual UI standards.

- Project_Name: {{Project_Name}}
- BI_Document: {{BI_Document_Name}}
- Version: {{Document_Version}}
- Date: {{Date}}
- Author: {{Author}}

## Purpose
Instruction: Establish a single source of truth for business metrics, KPI ownership, dashboard/report inventory, and dashboard-level access tiering used across all BI/reporting delivery.

- BI_Semantic_Model_Objective: {{Objective}}
- Applicability_Rule: Populate this template only when `Domain: Data_And_Analytics` and `Data_Analytics_Subtype` includes `BI_Reporting_Analytics`. It feeds `04_Target_Solution_Architecture.md` (semantic-layer architecture, access tiering) and `05_Technology_Engineering_And_Design.md` (dashboard/report inventory, refresh cadence) in the optimized artifact set — see the Data And Analytics Domain Coverage Map in `ADLC_MasterPrompt.md`.

## BI Source Inventory
Instruction: Record BI sources used to derive the semantic model and dashboard inventory; do not invent metrics or dashboards without marking them as recommendations.

| Source_ID | Source_Type | Source_Name_or_Path | Used_For | Status |
|---|---|---|---|---|
| BISRC-001 | {{BI_Export_Semantic_Model_Dashboard_Screenshot_KPI_Definition_Recommendation}} | {{Source_Name_or_Path}} | {{Metric_Definition_Dashboard_Layout_Access_Rule_Refresh_Cadence}} | {{Approved_Assumed_Recommendation}} |

## BI Semantic Model Boundaries
Instruction: Keep this artifact focused on the semantic/metric layer and dashboard inventory, not generic application UI or the underlying warehouse/pipeline architecture.

- Owns: Metric/KPI definitions, semantic model certification, dashboard/report inventory, dashboard-level row/column access tiering, refresh cadence and staleness SLAs, self-service and embedded-analytics governance.
- Does_Not_Own: Warehouse/lakehouse storage design, ingestion pipelines, or master data management — these belong to `04_Target_Solution_Architecture.md`'s Data Pipeline And Storage Architecture and Master Data Management Design sections. Generic application UI/design tokens unrelated to dashboards belong to `11_UI_Template.md`/`14_Design_System_Template.md` when the project also has a non-BI front end.
- Implementation_Link: Semantic-layer architecture and access-tiering rules are consolidated into `04_Target_Solution_Architecture.md`'s BI Semantic Model And Metric Layer Architecture section; dashboard/report inventory and refresh cadence are consolidated into `05_Technology_Engineering_And_Design.md`'s BI Semantic Model And Dashboard Inventory section.
- Access_Control_Link: Row/column-level access rules share one vocabulary with `04_Target_Solution_Architecture.md`'s Access Control And Masking Rules — do not define a duplicate access scheme here; reference `Access_Rule_ID` values instead.

## Metric And KPI Definitions
Instruction: Define every business metric with an unambiguous formula, grain, and certification status before it is exposed on a dashboard.

| Metric_ID | Metric_or_KPI | Formula | Grain | Source_Dataset | Owning_Data_Product | Business_Owner | Certification_Status |
|---|---|---|---|---|---|---|---|
| MET-001 | {{Metric_or_KPI}} | {{Formula}} | {{Grain}} | {{Source_Dataset}} | {{Data_Product}} | {{Owner}} | {{Draft_Certified_Deprecated}} |

## KPI Tree
Instruction: Decompose top-level KPIs into contributing metrics; each node needs a named business owner and refresh SLA. Consolidates into `02_Requirements_And_Scope.md`'s KPI Tree And Data Product Ownership section.

| KPI_Tree_ID | KPI_or_Metric_ID | Parent_KPI_Tree_ID | Contribution_Rule | Business_Owner | Refresh_SLA | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|
| KPI-TREE-001 | {{Metric_ID}} | {{Parent_ID_or_None}} | {{Contribution_Rule}} | {{Owner}} | {{SLA}} | {{IDs}} |

## Dashboard And Report Inventory
Instruction: One row per dashboard/report. Consolidates into `05_Technology_Engineering_And_Design.md`'s BI Semantic Model And Dashboard Inventory section.

| Dashboard_ID | Dashboard_or_Report_Name | Tool | Audience | Embedded_or_Standalone | Related_Metric_IDs | Refresh_Cadence | Staleness_SLA | Owner |
|---|---|---|---|---|---|---|---|---|
| DASH-001 | {{Name}} | {{PowerBI_Tableau_Looker_Qlik_Other}} | {{Audience}} | {{Embedded_Standalone}} | {{Metric_IDs}} | {{Cadence}} | {{SLA}} | {{Owner}} |

## Row And Column Level Access Tiering
Instruction: Express dashboard access rules as references to `Access_Rule_ID` values defined in `04_Target_Solution_Architecture.md`'s Access Control And Masking Rules — do not redefine ABAC/masking rules here.

| Tiering_ID | Dashboard_ID | Access_Rule_ID | Row_or_Column_Scope | Audience_Segment | Evidence |
|---|---|---|---|---|---|
| TIER-001 | {{Dashboard_ID}} | {{Access_Rule_ID}} | {{Row_or_Column}} | {{Segment}} | {{Evidence}} |

## Self-Service And Embedded Analytics Governance
Instruction: Define the certification workflow for self-service reports before promotion to "official," and governance for embedded/customer-facing analytics.

| Governance_ID | Area | Rule | Applies_To | Owner |
|---|---|---|---|---|
| BI-GOV-001 | {{Self_Service_Certification_Promotion_Embedded_Tenant_Isolation_Rate_Limit}} | {{Rule}} | {{Applies_To}} | {{Owner}} |

## Traceability Instructions
Instruction: Link metrics, KPIs, and dashboards to requirements, architecture, and access-control evidence.

- Traceability_Rule_1: Every Metric_ID must map to a source dataset recorded in `01_Source_Baseline.md` or `04_Target_Solution_Architecture.md`.
- Traceability_Rule_2: Every KPI_Tree_ID must map to a KPI entry in `02_Requirements_And_Scope.md`'s KPI Tree And Data Product Ownership section.
- Traceability_Rule_3: Every Dashboard_ID must map to a Semantic_ID in `04_Target_Solution_Architecture.md`'s BI Semantic Model And Metric Layer Architecture section.
- Traceability_Rule_4: Every access-tiering row must reference an existing Access_Rule_ID — never define a new, unreferenced access rule inside this template.
- Traceability_Rule_5: Every dashboard must map to a BI Dashboard UAT And KPI Reconciliation row in `07_Quality_Test_And_Validation.md` before release.
