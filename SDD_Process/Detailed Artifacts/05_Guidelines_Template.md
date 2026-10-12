# Guidelines Template

## Metadata
Instruction: Reference upstream artifacts explicitly and preserve the Guidelines artifact as the technology-agnostic engineering policy layer.

- Template_Version: {{Template_Version}}
- Document_Version: {{Document_Version}}
- Project_Name: {{Project_Name}}
- Project_Code: {{Project_Code}}
- Requirement_Specification_Document: {{Requirement_Specification_Document_Name}}
- Flows_Document: {{Flows_Document_Name}}
- Solution_Document: {{Solution_Document_Name}}
- Optional_UI_Document: {{UI_Document_Name_or_Not_Applicable}}
- Optional_Design_System_Document: {{Design_System_Document_Name_or_Not_Applicable}}
- Optional_Technology_Specification_Document: {{Technology_Specification_Document_Name_or_Not_Applicable}}
- Author: {{Author}}
- Reviewed_By: {{Reviewed_By}}
- Date: {{Date}}

## Purpose
Instruction: Define stack-neutral engineering standards, reusable delivery practices, and quality expectations. Keep concrete technology choices in Technology Specification, visual tokens and component styling in Design_System, and implementation plans in Code-And-Test.

- Standardization_Objective: {{Standardization_Objective}}
- Engineering_Goal: {{Engineering_Goal}}
- Intended_Audience: {{Engineering_Product_Security_QA_Operations_Audience}}
- Technology_Posture: Technology-agnostic unless the input document or upstream artifacts mandate stack-specific decisions.
- Recommendation_Rule: Mark non-source-derived practices as `[RECOMMENDATION]`.
- Risk_Rule: Mark contradictions, missing controls, or infeasible standards as `[GUIDELINE RISK]`.

## Guideline Scope and Source Rules
Instruction: Define how guidelines are derived, constrained, and traced to avoid invented or conflicting standards.

- Source_Precedence: {{Specification_Flows_Solution_UI_Database_DesignSystem_Technology_Specification_Precedence}}
- Upstream_Traceability_Rule: Every guideline category must map to one or more FR, NFR, CON, WF, DF, CMP, DD, or source artifact IDs.
- Technology_Neutrality_Rule: Do not introduce a framework, vendor service, library, protocol, package, or file layout unless already mandated upstream or explicitly marked `[RECOMMENDATION]`.
- Artifact_Boundary_Rule: Guidelines define policy and quality expectations; Technology Specification defines concrete stack and directory structure; Design_System defines reusable visual tokens and component styling; Code-And-Test defines implementation modules and test cases.
- Exception_Rule: Exceptions must include rationale, owner, approver, approval date/status, affected artifacts, mitigation, expiry or review date, and related FR/NFR/CON IDs.
- Evidence_Rule: Each mandatory guideline must identify how compliance will be verified through review, automated checks, tests, audit logs, runbooks, or documented sign-off.

## Engineering Principles
Instruction: Define architecture and delivery principles that apply across technologies.

- Principle_1: {{Principle_1}}
- Principle_2: {{Principle_2}}
- Principle_3: {{Principle_3}}
- Principle_4: {{Principle_4}}
- Principle_5: {{Principle_5}}
- Reuse_Principle: Prefer reusable contracts, modules, components, policies, fixtures, and configuration patterns over duplicated or screen-specific implementations.
- Simplicity_Principle: Keep modules focused and composable; avoid abstractions that do not reduce duplication, clarify boundaries, or improve testability.
- Traceability_Principle: Design and implementation standards must remain traceable to business capability, risk, quality attribute, or operational need.

## Coding and Maintainability Guidelines
Instruction: Define mandatory coding practices without prescribing a specific programming language or framework.

- Readability_Rules: {{Readability_Rules}}
- Modularity_Rules: {{Modularity_Rules}}
- Interface_Contract_Rules: {{Interface_Contract_Rules}}
- Validation_Rules: {{Validation_Rules}}
- Error_Handling_Rules: {{Error_Handling_Rules}}
- Logging_Rules: {{Logging_Rules}}
- Configuration_Rules: {{Configuration_Rules}}
- Dependency_Management_Rules: {{Dependency_Management_Rules}}
- Repository_Hygiene_Rules: Generated application source must be version controlled unless explicitly marked not applicable; ignore rules must exclude secrets, local environment files, dependencies, build outputs, logs, caches, coverage reports, temporary files, and machine-specific files.
- Maintainability_Rules: {{Maintainability_Rules}}
- Documentation_Rules: {{Documentation_Rules}}
- Generated_Code_Rules: {{Generated_Code_Rules}}

## Separation of Concerns and Reuse Rules
Instruction: Prevent monolithic artifacts and require reusable boundaries across UI, domain, integration, data, configuration, and tests.

- Monolithic_File_Rule: Do not combine interfaces/contracts, UI markup, styling, business logic, data access, integration adapters, configuration, and tests in one implementation file unless the upstream Technology Specification explicitly permits a small single-file prototype.
- Contract_Separation_Rule: Public interfaces, API contracts, event/message schemas, data transfer shapes, and validation contracts must be separated from business logic and implementation adapters.
- Domain_Logic_Rule: Business/domain rules must be isolated from presentation, persistence, transport, and external integration concerns.
- Adapter_Rule: External system access, file/storage access, network calls, and database access must go through dedicated adapters or ports with documented inputs, outputs, failure modes, and traceability.
- UI_Component_Rule: Reusable UI behavior must be implemented through components or equivalent reusable units; screen/page files should compose reusable units rather than duplicating behavior.
- Style_Token_Rule: Visual styling must use reusable design tokens and component patterns from Design_System where available; do not hard-code duplicate color, spacing, typography, table, form, or status styles across screens.
- Test_Fixture_Rule: Test data, mocks, stubs, and fixtures must be reusable and separated from production logic.
- Configuration_Separation_Rule: Environment-specific values, secrets, endpoints, feature flags, and operational thresholds must be externalized through the approved configuration model.
- Artifact_Reuse_Rule: Reuse existing ADLC artifact IDs, component names, workflow names, and data entity names rather than inventing synonyms.

## Naming Conventions
Instruction: Standardize names for consistency across code, artifacts, operations, tests, and reusable design assets.

| Artifact_Type | Convention | Example | Related_Artifact_or_ID |
|---|---|---|---|
| Module | {{Module_Convention}} | {{Module_Example}} | {{CMP_or_US_ID_List}} |
| Interface_or_Contract | {{Interface_Contract_Convention}} | {{Interface_Contract_Example}} | {{CMP_INT_or_DF_ID_List}} |
| API_or_Route | {{API_Route_Convention}} | {{API_Route_Example}} | {{FR_or_INT_ID_List}} |
| Event_or_Message | {{Event_Message_Convention}} | {{Event_Message_Example}} | {{WF_DF_or_INT_ID_List}} |
| Data_Entity | {{Data_Entity_Convention}} | {{Data_Entity_Example}} | {{DATA_or_FR_ID_List}} |
| Database_or_Storage_Object | {{Database_Storage_Convention}} | {{Database_Storage_Example}} | {{DATA_or_NFR_ID_List}} |
| Configuration_Key | {{Configuration_Key_Convention}} | {{Configuration_Key_Example}} | {{NFR_CON_or_TSD_ID_List}} |
| Log_Event | {{Log_Event_Convention}} | {{Log_Event_Example}} | {{OPS_or_NFR_ID_List}} |
| Reusable_UI_Component | {{UI_Component_Convention}} | {{UI_Component_Example}} | {{UI_or_FR_ID_List}} |
| Style_or_Design_Token | {{Style_Token_Convention}} | {{Style_Token_Example}} | {{Design_System_Token_or_NFR_ID_List}} |
| Test_Case | {{Test_Case_Convention}} | {{Test_Case_Example}} | {{FR_NFR_or_US_ID_List}} |
| Test_Fixture | {{Test_Fixture_Convention}} | {{Test_Fixture_Example}} | {{TC_or_DATA_ID_List}} |
| Runbook_or_Operational_Item | {{Runbook_Convention}} | {{Runbook_Example}} | {{OPS_or_NFR_ID_List}} |

## Security and Privacy Guidelines
Instruction: Define baseline controls for identity, authorization, secure data handling, privacy, and abuse resistance without prescribing vendor-specific tools unless mandated upstream.

- Authentication_Rules: {{Authentication_Rules}}
- Authorization_Rules: {{Authorization_Rules}}
- RBAC_or_ABAC_Rules: {{RBAC_ABAC_Rules}}
- Input_Output_Validation_Rules: {{Input_Output_Validation_Rules}}
- Secret_Management_Rules: {{Secret_Management_Rules}}
- Data_Protection_Rules: {{Data_Protection_Rules}}
- Privacy_Rules: {{Privacy_Rules}}
- Network_Security_Rules: {{Network_Security_Rules}}
- WAF_Firewall_Rate_Limit_Rules: {{WAF_Firewall_Rate_Limit_Rules}}
- Auditability_Rules: {{Auditability_Rules}}
- Secure_Defaults_Rules: {{Secure_Defaults_Rules}}

## Performance and Scalability Guidelines
Instruction: Define measurable performance expectations, growth assumptions, and efficient resource usage.

- Performance_Targets: {{Performance_Targets}}
- Scalability_Rules: {{Scalability_Rules}}
- Pagination_Filtering_Search_Rules: {{Pagination_Filtering_Search_Rules}}
- Caching_Rules: {{Caching_Rules}}
- Concurrency_Rules: {{Concurrency_Rules}}
- Resource_Usage_Rules: {{Resource_Usage_Rules}}
- Performance_Testing_Rules: {{Performance_Testing_Rules}}
- Capacity_Planning_Assumptions: {{Capacity_Planning_Assumptions}}

## Resilience and Recovery Guidelines
Instruction: Define failure handling, recovery behavior, idempotency, data consistency, and degraded-mode expectations.

- Availability_Targets: {{Availability_Targets}}
- Retry_Timeout_Backoff_Rules: {{Retry_Timeout_Backoff_Rules}}
- Idempotency_Rules: {{Idempotency_Rules}}
- Data_Consistency_Rules: {{Data_Consistency_Rules}}
- Transaction_or_Compensation_Rules: {{Transaction_Compensation_Rules}}
- Degraded_Mode_Rules: {{Degraded_Mode_Rules}}
- Backup_Restore_Rules: {{Backup_Restore_Rules}}
- RPO_RTO_Targets: {{RPO_RTO_Targets}}
- Failure_Mode_Rules: {{Failure_Mode_Rules}}

## Observability and Operations Guidelines
Instruction: Define logs, metrics, traces, health checks, alerts, runbooks, and support ownership.

- Structured_Logging_Rules: {{Structured_Logging_Rules}}
- Correlation_Tracing_Rules: {{Correlation_Tracing_Rules}}
- Metrics_Rules: {{Metrics_Rules}}
- Health_Check_Rules: {{Health_Check_Rules}}
- Alerting_Rules: {{Alerting_Rules}}
- Dashboard_Rules: {{Dashboard_Rules}}
- Runbook_Rules: {{Runbook_Rules}}
- Support_Ownership_Rules: {{Support_Ownership_Rules}}
- Operational_Readiness_Rules: {{Operational_Readiness_Rules}}

## Accessibility and Usability Guidelines
Instruction: Define inclusive, reusable user experience rules while leaving visual token details to Design_System.

- Accessibility_Target: {{Accessibility_Target}}
- Keyboard_Navigation_Rules: {{Keyboard_Navigation_Rules}}
- Screen_Reader_and_Semantics_Rules: {{Screen_Reader_Semantics_Rules}}
- Color_Contrast_Rules: {{Color_Contrast_Rules}}
- Responsive_Behavior_Rules: {{Responsive_Behavior_Rules}}
- Error_State_and_Empty_State_Rules: {{Error_Empty_State_Rules}}
- Internationalization_or_Localization_Rules: {{I18N_L10N_Rules}}
- Design_System_Alignment_Rules: {{Design_System_Alignment_Rules}}

## Quality Gates and Review Criteria
Instruction: Define measurable acceptance checks that prove guideline compliance before implementation, release, or handoff.

| Gate_ID | Gate_Name | Required_Check | Evidence | Owner | Applies_To | Related_FR_NFR_CON_IDs |
|---|---|---|---|---|---|---|
| GATE-001 | {{Gate_Name}} | {{Required_Check}} | {{Evidence_or_Tool_Output}} | {{Owner}} | {{Artifact_Module_Service_UI_Data_Operation}} | {{FR_NFR_CON_ID_List}} |

### Review Checklist
Instruction: Use this checklist during architecture, implementation, security, QA, and release reviews.

- Review_Check_1: Guidelines remain technology-agnostic unless upstream artifacts mandate a specific technology or `[RECOMMENDATION]` is used.
- Review_Check_2: Interfaces/contracts, domain logic, adapters, UI components, style tokens, configuration, and tests are separated into reusable units.
- Review_Check_3: No monolithic implementation file combines contracts, UI, styling, business logic, data access, integration, configuration, and tests.
- Review_Check_4: Security, privacy, performance, resilience, observability, accessibility, and maintainability rules have measurable evidence.
- Review_Check_5: Exceptions include rationale, owner, approval path, affected artifacts, mitigation, review date, and related FR/NFR/CON IDs.

## Guideline Exceptions and Risks
Instruction: Capture approved deviations, risks, and open questions instead of silently weakening standards.

| Item_ID | Type | Guideline_Area | Exception_or_Risk | Rationale_or_Impact | Owner | Approver | Status | Mitigation | Review_Date | Related_IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| GLR-001 | {{Exception_GUIDELINE_RISK_Open_Question}} | {{Guideline_Area}} | {{Exception_or_Risk}} | {{Rationale_or_Impact}} | {{Owner}} | {{Approver}} | {{Proposed_Approved_Rejected_Open}} | {{Mitigation}} | {{YYYY-MM-DD}} | {{FR_NFR_CON_CMP_ID_List}} |

## Traceability Matrix
Instruction: Map guideline categories and mandatory standards back to upstream requirements, solution components, risks, and validation paths.

| Trace_ID | Guideline_Category | Guideline_Item | Upstream_IDs | Validation_Path | Evidence_Owner |
|---|---|---|---|---|---|
| TR-GL-001 | {{Guideline_Category}} | {{Guideline_Item}} | {{FR_NFR_CON_WF_DF_CMP_DD_ID_List}} | {{Review_Test_Audit_Runbook_Check}} | {{Owner}} |

## Traceability Instructions
Instruction: Every guideline area must map upstream and every uncertainty must be explicit.

- Traceability_Rule_1: Each guideline category must map to one or more FR/NFR/CON IDs or be marked `[RECOMMENDATION]`.
- Traceability_Rule_2: Security and privacy guidelines must map to security, compliance, trust-boundary, data-classification, or audit requirements.
- Traceability_Rule_3: Performance, scalability, resilience, and recovery guidelines must map to measurable NFRs or documented assumptions.
- Traceability_Rule_4: Accessibility and usability guidelines must map to UI, persona, or NFR accessibility requirements.
- Traceability_Rule_5: Reuse and separation-of-concerns guidelines must map to solution components, Technology Specification structure, Design_System patterns, or maintainability NFRs.
- Traceability_Rule_6: Quality gates must identify evidence, owner, and applicable artifact or delivery unit.
- Traceability_Rule_7: Exceptions and risks must identify owner, approver, mitigation, review date, and affected upstream IDs.
