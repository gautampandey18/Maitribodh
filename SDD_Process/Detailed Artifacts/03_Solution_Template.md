# Solution Template

## Metadata
Instruction: Reference upstream artifacts explicitly and preserve the Solution artifact as Step 3.

- Template_Version: {{Template_Version}}
- Document_Version: {{Document_Version}}
- Project_Name: {{Project_Name}}
- Project_Code: {{Project_Code}}
- Requirement_Specification_Document: {{Requirement_Specification_Document_Name}}
- Flows_Document: {{Flows_Document_Name}}
- Optional_UI_Document: {{UI_Document_Name_or_Not_Applicable}}
- Optional_Database_Document: {{Database_Document_Name_or_Not_Applicable}}
- Author: {{Author}}
- Reviewed_By: {{Reviewed_By}}
- Date: {{Date}}

## Purpose
Instruction: Define an end-to-end solution architecture blueprint that can drive implementation, review, and graphical architecture generation.

- Architectural_Goal: {{Architectural_Goal}}
- Business_Capability: {{Business_Capability}}
- Architecture_Principles: {{Architecture_Principles}}
- Technology_Posture: Technology-neutral unless the input document or upstream artifacts mandate stack-specific decisions.
- Recommendation_Rule: Mark non-source-derived architecture choices as `[RECOMMENDATION]`.
- Risk_Rule: Mark contradictions, missing integration details, or infeasible requirements as `[ARCHITECTURE RISK]`.
- Duplication_Rule: Define architecture decisions and implications; reference 11_UI.md for detailed screen/control evidence, 12_Database.md for schema evidence, 13_Technology_Specification.md for concrete stack/file layout, and 14_Design_System.md for reusable visual tokens.

## Executive Summary
Instruction: Summarize the solution for business and technical reviewers.

- Solution_Intent: {{Solution_Intent}}
- Scope_Summary: {{Scope_Summary}}
- Target_Outcome: {{Target_Outcome}}
- Key_Assumptions: {{Key_Assumptions}}
- Primary_Architecture_Outcome: {{Primary_Architecture_Outcome}}
- Related_FR_NFR_IDs: {{FR_NFR_ID_List}}

## System Overview
Instruction: Describe project type, current state, target state, users, and system boundaries.

- Project_Type: {{New_Build_Modernization_Integration_Extension}}
- Current_State: {{Current_State_Summary}}
- Target_State: {{Target_State_Summary}}
- Primary_Users: {{User_or_Persona_ID_List}}
- Upstream_Systems: {{Upstream_System_List}}
- Downstream_Systems: {{Downstream_System_List}}
- In_Scope_Capabilities: {{In_Scope_Capability_List}}
- Out_Of_Scope_Capabilities: {{Out_Of_Scope_Capability_List}}
- System_Boundary: {{System_Boundary_Definition}}
- Trust_Boundaries: {{Trust_Boundary_List}}
- Related_Spec_IDs: {{FR_NFR_CON_ID_List}}

## Architecture Design
Instruction: Define the architecture style, key views, boundaries, and diagram-generation guidance.

- Architecture_Style: {{Layered_Event_Driven_Microservices_Modular_Monolith_Serverless_Other}}
- Interaction_Model: {{Interaction_Model_Summary}}
- Logical_Architecture_View: {{Logical_Architecture_Summary}}
- Deployment_View: {{Deployment_View_Summary}}
- Integration_View: {{Integration_View_Summary}}
- Data_Flow_View: {{Data_Flow_View_Summary}}
- Boundary_Definitions: {{Boundary_Definitions}}
- Diagram_Generation_Notes: {{Diagram_Generation_Notes}}
- Related_WF_DF_IDs: {{WF_DF_ID_List}}

### Context Diagram Source
Instruction: Provide Mermaid-compatible source for a context diagram. Keep node IDs aligned to the Architecture Node Inventory.

```mermaid
flowchart LR
  USER[{{Primary_User_or_Actor}}] --> SYS[{{System_Name}}]
  SYS --> EXT[{{External_System}}]
```

### Component and Integration Diagram Source
Instruction: Provide Mermaid-compatible source for component and integration relationships. Include only nodes and connections listed in diagram-ready tables.

```mermaid
flowchart TB
  CMP001[{{Component_Name}}] --> INT001[{{Integration_or_Service}}]
  INT001 --> EXT001[{{External_System}}]
```

### Data Flow Diagram Source
Instruction: Provide Mermaid-compatible source for primary data movement. Use Data_Flow_ID values from the Data Flow Mapping table.

```mermaid
flowchart LR
  SRC[{{Data_Source}}] --> PROC[{{Processing_Component}}]
  PROC --> DEST[{{Data_Destination}}]
```

## Diagram-Ready Architecture Inventory
Instruction: Populate these tables so an AI agent or architect can generate graphical architecture images.

### Architecture Nodes
| Architecture_Node_ID | Node_Name | Node_Type | Layer | Trust_Zone | Deployment_Unit | Owner | Related_Component_IDs | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|---|
| NODE-001 | {{Node_Name}} | {{User_Interface_Service_Database_External_System_Queue_File_Actor}} | {{Presentation_Application_Data_Integration_External}} | {{Public_Private_Restricted_ThirdParty}} | {{Deployment_Unit}} | {{Owner}} | {{CMP_ID_List}} | {{FR_NFR_ID_List}} |

### Architecture Connections
| Connection_ID | Source_Node_ID | Target_Node_ID | Protocol | Data_Object | Direction | Frequency | Security_Control | Related_DF_IDs |
|---|---|---|---|---|---|---|---|---|
| CONN-001 | {{NODE_ID}} | {{NODE_ID}} | {{HTTPS_Event_File_DB_Message_Other}} | {{Data_Object}} | {{Inbound_Outbound_Bidirectional}} | {{RealTime_Scheduled_OnDemand_Batch}} | {{Auth_Encryption_Network_Control}} | {{DF_ID_List}} |

### Diagram Views
| Diagram_View | Purpose | Included_Nodes | Included_Connections | Audience |
|---|---|---|---|---|
| Context | {{Context_Diagram_Purpose}} | {{NODE_ID_List}} | {{CONN_ID_List}} | {{Business_Technical_Security_Operations}} |
| Component_Integration | {{Component_Diagram_Purpose}} | {{NODE_ID_List}} | {{CONN_ID_List}} | {{Business_Technical_Security_Operations}} |
| Data_Flow | {{Data_Flow_Diagram_Purpose}} | {{NODE_ID_List}} | {{CONN_ID_List}} | {{Business_Technical_Security_Operations}} |

## Component Breakdown
Instruction: Identify logical components, ownership, responsibilities, dependencies, contracts, and traceability.

| Component_ID | Component_Name | Responsibility | Owner | Inputs | Outputs | Dependencies | Interface_Type | Related_FR_NFR_IDs | Related_WF_DF_IDs |
|---|---|---|---|---|---|---|---|---|---|
| CMP-001 | {{Component_Name}} | {{Responsibility}} | {{Owner}} | {{Input_Data}} | {{Output_Data}} | {{Dependency_ID_List}} | {{API_Event_File_UI_DB_Internal}} | {{FR_NFR_ID_List}} | {{WF_DF_ID_List}} |

## Integration Architecture
Instruction: Define all external and internal integrations with enough detail for delivery and operations.

### External Systems
| External_System_ID | System_Name | Integration_Type | Data_Exchanged | Criticality | Failure_Mode | Owner | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|
| EXT-001 | {{System_Name}} | {{API_Event_File_DB_Message_Manual}} | {{Data_Exchanged}} | {{Critical_High_Medium_Low}} | {{Failure_Mode}} | {{Owner}} | {{FR_NFR_ID_List}} |

### Integration Contracts
| Integration_ID | Producer | Consumer | Contract_Type | Protocol | Auth_Method | Exchange_Pattern | Frequency | Failure_Handling | Retry_Reconciliation | Related_DF_IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| INT-001 | {{Producer}} | {{Consumer}} | {{API_Event_File_Message_DB}} | {{Protocol}} | {{Auth_Method}} | {{Sync_Async_Batch_OnDemand}} | {{Frequency}} | {{Failure_Strategy}} | {{Retry_or_Reconciliation_Rule}} | {{DF_ID_List}} |

## Data Architecture
Instruction: Define data ownership, source of truth, lineage, lifecycle, and database constraints when applicable.

### Data Domains and Ownership
| Data_Entity_ID | Entity_Name | Source_Of_Truth | Read_Owner | Write_Owner | Data_Classification | Lifecycle_Rule | Retention_Rule | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|---|
| DATA-001 | {{Entity_Name}} | {{Source_System_or_Component}} | {{Read_Owner}} | {{Write_Owner}} | {{Public_Internal_Confidential_Restricted}} | {{Lifecycle_Rule}} | {{Retention_Rule}} | {{FR_NFR_ID_List}} |

### Data Flow Mapping
| Data_Flow_ID | Source | Processing_Component | Destination | CRUD_Operation | Data_Object | Validation_Rule | Related_WF_ST_IDs | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|---|
| DF-MAP-001 | {{Source}} | {{Component_ID}} | {{Destination}} | {{Create_Read_Update_Delete}} | {{Data_Object}} | {{Validation_Rule}} | {{WF_ST_ID_List}} | {{FR_NFR_ID_List}} |

### Database and Storage Constraints
Instruction: Reference 12_Database.md when available; otherwise capture planned storage constraints from 01_Requirement_Specification.md without inventing schema details.

- Database_Architecture: {{Database_Architecture_or_Not_Applicable}}
- Storage_Model: {{Storage_Model}}
- Schema_Constraints: {{Schema_Constraints}}
- Indexing_Search_Needs: {{Indexing_Search_Needs}}
- Backup_Restore_Needs: {{Backup_Restore_Needs}}
- Database_Traceability: {{Database_or_FR_NFR_ID_List}}

## Technical Stack
Instruction: Capture technology decisions only when required by source inputs or as clearly marked recommendations.

| Stack_Decision_ID | Layer | Technology_or_Standard | Decision_Status | Rationale | Alternatives_Considered | Constraint_or_Source_IDs | Related_NFR_IDs |
|---|---|---|---|---|---|---|---|
| TSD-001 | {{Layer}} | {{Technology_or_Standard}} | {{Mandated_Recommended_Open}} | {{Rationale}} | {{Alternatives}} | {{CON_or_Source_ID_List}} | {{NFR_ID_List}} |

## Infrastructure and Deployment
Instruction: Define environments, hosting model, deployment topology, network zones, CI/CD, secrets, and release units.

| Infrastructure_ID | Environment | Hosting_Model | Deployment_Unit | Network_Zone | Config_Secrets_Model | Scaling_Unit | Release_Topology | Related_Component_IDs | Related_NFR_CON_IDs |
|---|---|---|---|---|---|---|---|---|---|
| INF-001 | {{Dev_Test_Stage_Prod}} | {{Cloud_OnPrem_Hybrid_Local}} | {{Deployment_Unit}} | {{Network_Zone}} | {{Config_and_Secrets_Model}} | {{Scaling_Unit}} | {{Release_Topology}} | {{CMP_ID_List}} | {{NFR_CON_ID_List}} |

## Security and Compliance
Instruction: Define authentication, authorization, trust boundaries, protection controls, auditability, and compliance mappings.

- Authentication_Model: {{Authentication_Model}}
- Authorization_Model: {{Authorization_Model}}
- RBAC_Model: {{RBAC_Model}}
- Trust_Boundaries: {{Trust_Boundaries}}
- Encryption_In_Transit: {{Encryption_In_Transit}}
- Encryption_At_Rest: {{Encryption_At_Rest}}
- Audit_Logging: {{Audit_Logging_Approach}}
- PII_Data_Protection: {{PII_Data_Protection_Approach}}
- WAF_Firewall_Network_Controls: {{WAF_Firewall_Network_Controls}}

| Security_Control_ID | Control | Applies_To | Threat_or_Risk | Evidence_or_Mechanism | Related_FR_NFR_CON_IDs |
|---|---|---|---|---|---|
| SEC-001 | {{Security_Control}} | {{Component_Integration_Data_Entity}} | {{Threat_or_Risk}} | {{Evidence_or_Mechanism}} | {{FR_NFR_CON_ID_List}} |

## Scalability and Resilience
Instruction: Define performance targets, growth assumptions, failover, recovery, and degraded-mode behavior.

| Resilience_ID | Scenario | Target_or_Assumption | Strategy | Degraded_Behavior | RPO | RTO | Related_NFR_IDs |
|---|---|---|---|---|---|---|---|
| RES-001 | {{Scenario}} | {{Target_or_Assumption}} | {{Scaling_Caching_Queueing_Failover_Backup_Strategy}} | {{Degraded_Behavior}} | {{RPO}} | {{RTO}} | {{NFR_ID_List}} |

## Monitoring and Operations
Instruction: Define observability, health, alerting, support ownership, runbooks, and SLOs.

| Operations_ID | Area | Logs | Metrics | Traces | Alerts | Health_Checks | Dashboard_or_Runbook | Owner | Related_NFR_IDs |
|---|---|---|---|---|---|---|---|---|---|
| OPS-001 | {{Area}} | {{Log_Events}} | {{Metric_List}} | {{Trace_Needs}} | {{Alert_Rules}} | {{Health_Checks}} | {{Dashboard_or_Runbook}} | {{Owner}} | {{NFR_ID_List}} |

## Project Phases and Architecture Roadmap
Instruction: Separate MVP, future-state capabilities, migration needs, deferred decisions, and technical debt.

| Roadmap_ID | Phase | Capability_or_Architecture_Item | Status | Dependency | Technical_Debt_or_Risk | Decision_Required | Related_Backlog_or_FR_IDs |
|---|---|---|---|---|---|---|---|
| ROAD-001 | {{MVP_Phase_or_Future_Phase}} | {{Capability_or_Item}} | {{Included_Deferred_Optional}} | {{Dependency}} | {{Technical_Debt_or_Risk}} | {{Decision_Required}} | {{Backlog_or_FR_ID_List}} |

## Design Decisions
Instruction: Capture major decisions, rationale, alternatives, impacts, and source traceability.

| Decision_ID | Decision | Decision_Status | Reason | Alternatives_Considered | Impact | Related_Component_or_Integration_IDs | Related_FR_NFR_CON_IDs |
|---|---|---|---|---|---|---|---|
| DD-001 | {{Decision_Text}} | {{Mandated_Recommended_Open}} | {{Reason}} | {{Alternatives}} | {{Impact}} | {{CMP_INT_ID_List}} | {{FR_NFR_CON_ID_List}} |

## Open Questions and Architecture Risks
Instruction: Capture missing details instead of inventing architecture assumptions.

| Item_ID | Type | Question_or_Risk | Impact | Owner | Due_Date | Blocking_Artifact_or_Decision | Related_IDs |
|---|---|---|---|---|---|---|---|
| AR-001 | {{Open_Question_ARCHITECTURE_RISK}} | {{Question_or_Risk}} | {{Impact}} | {{Owner}} | {{YYYY-MM-DD}} | {{Blocking_Item}} | {{FR_NFR_WF_DF_CON_ID_List}} |

## Traceability Matrix
Instruction: Map architecture elements back to upstream requirements, flows, constraints, and quality attributes.

| Trace_ID | Architecture_Element_Type | Architecture_Element_ID | Upstream_IDs | Trace_Rationale | Validation_Path |
|---|---|---|---|---|---|
| TR-SOL-001 | {{Component_Integration_DataFlow_Decision_Risk_SecurityControl_Infrastructure}} | {{Element_ID}} | {{FR_NFR_WF_DF_CON_ID_List}} | {{Trace_Rationale}} | {{Validation_Path}} |

## Traceability Instructions
Instruction: Every architecture element must map upstream and every uncertainty must be explicit.

- Traceability_Rule_1: Components must map to FR/NFR IDs and, when applicable, WF/DF IDs.
- Traceability_Rule_2: Integrations must map to data flows, source systems, and related FR/NFR IDs.
- Traceability_Rule_3: Data mappings must map to WF/DF IDs and validation rules.
- Traceability_Rule_4: Infrastructure and security controls must map to NFR/CON IDs.
- Traceability_Rule_5: Design decisions must map to one or more requirements, constraints, or quality needs.
- Traceability_Rule_6: Architecture risks and open questions must identify owner, impact, and affected upstream IDs.
- Traceability_Rule_7: Diagram node and connection IDs must match the diagram-ready architecture inventory.
