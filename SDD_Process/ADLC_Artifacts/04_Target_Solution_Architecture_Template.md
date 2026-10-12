# Target Solution Architecture Template

## Metadata
- Project_Name: {{Project_Name}}
- Execution_Mode: {{Execution_Mode}}
- Delivery_Tier: {{Delivery_Tier}}
- Requirements: 02_Requirements_And_Scope.md
- Current_State: {{03_Current_State_Analysis.md_or_Not_Applicable}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Owner: {{Owner}}

## Purpose
Instruction: Define target-state architecture, integrations, data architecture, security architecture, compliance posture, resilience, operations, and architecture decisions.

- Architecture_Objective: {{Architecture_Objective}}
- Target_State_Rule: Do not reproduce legacy design unless explicitly retained with rationale.

## Executive Summary
- Solution_Intent: {{Solution_Intent}}
- Target_Outcome: {{Target_Outcome}}
- Architecture_Style: {{Layered_Event_Driven_Microservices_Modular_Monolith_Serverless_Other}}
- System_Boundary: {{System_Boundary}}
- Trust_Boundaries: {{Trust_Boundaries}}
- Related_FR_NFR_IDs: {{FR_NFR_IDs}}

## Architecture Views
### Context Diagram Source
```mermaid
flowchart LR
  USER[{{Primary_User_or_Actor}}] --> SYS[{{System_Name}}]
  SYS --> EXT[{{External_System}}]
```

### Component And Integration Diagram Source
```mermaid
flowchart TB
  CMP001[{{Component_Name}}] --> INT001[{{Integration_or_Service}}]
  INT001 --> EXT001[{{External_System}}]
```

### Data Flow Diagram Source
```mermaid
flowchart LR
  SRC[{{Data_Source}}] --> PROC[{{Processing_Component}}]
  PROC --> DEST[{{Data_Destination}}]
```

## Diagram-Ready Architecture Inventory
Instruction: Preserve node, connection, and view tables from the detailed solution template.

### Architecture Nodes
| Architecture_Node_ID | Node_Name | Node_Type | Layer | Trust_Zone | Deployment_Unit | Owner | Related_Component_IDs | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|---|
| NODE-001 | {{Node_Name}} | {{User_Interface_Service_Database_External_System_Queue_File_Actor_Dataset_Pipeline_Dashboard}} | {{Layer}} | {{Trust_Zone}} | {{Deployment_Unit}} | {{Owner}} | {{CMP_IDs}} | {{FR_NFR_IDs}} |

### Architecture Connections
| Connection_ID | Source_Node_ID | Target_Node_ID | Protocol | Data_Object | Direction | Frequency | Security_Control | Related_DataFlow_IDs |
|---|---|---|---|---|---|---|---|---|
| CONN-001 | {{NODE_ID}} | {{NODE_ID}} | {{Protocol}} | {{Data_Object}} | {{Direction}} | {{Frequency}} | {{Control}} | {{DF_IDs}} |

### Diagram Views
| Diagram_View | Purpose | Included_Nodes | Included_Connections | Audience |
|---|---|---|---|---|
| {{Context_Component_Integration_Data_Flow_Deployment_Security}} | {{Purpose}} | {{NODE_IDs}} | {{CONN_IDs}} | {{Audience}} |

## Component Architecture
| Component_ID | Component_Name | Responsibility | Owner | Inputs | Outputs | Dependencies | Interface_Type | Related_FR_NFR_WF_IDs |
|---|---|---|---|---|---|---|---|---|
| CMP-001 | {{Component}} | {{Responsibility}} | {{Owner}} | {{Inputs}} | {{Outputs}} | {{Dependencies}} | {{API_Event_File_UI_DB_Internal}} | {{IDs}} |

## Integration Architecture
| Integration_ID | External_or_Internal_System | Producer | Consumer | Protocol_or_SDK | Auth_Method | Data_Exchanged | Frequency | Failure_Handling | Retry_Reconciliation | Monitoring | Related_IDs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| INT-001 | {{System}} | {{Producer}} | {{Consumer}} | {{Protocol}} | {{Auth}} | {{Data}} | {{Frequency}} | {{Failure}} | {{Retry}} | {{Monitoring}} | {{FR_NFR_WF_IDs}} |

## Data Architecture And Governance
| Data_ID | Entity_or_Domain | Source_Of_Truth | Read_Owner | Write_Owner | Classification | Retention_Rule | Access_Control | Encryption | Related_FR_NFR_IDs |
|---|---|---|---|---|---|---|---|---|---|
| DATA-001 | {{Entity_or_Domain}} | {{Source}} | {{Owner}} | {{Owner}} | {{Public_Internal_Confidential_Restricted}} | {{Retention}} | {{Access}} | {{At_Rest_In_Transit}} | {{IDs}} |

## Data Pipeline And Storage Architecture
Instruction: Required when `Domain: Data_And_Analytics` and `Data_Analytics_Subtype` includes Data_Pipeline_ETL, Data_Warehouse_Lakehouse, or Data_Migration; mark Not Applicable with rationale otherwise.

| Pipeline_Arch_ID | Pipeline_or_Zone | Ingestion_Pattern | Source_Dataset | Target_Dataset | Transformation_Logic_Ref | Orchestrator | Schedule_or_Trigger | SLA | Failure_Handling | Related_Data_IDs |
|---|---|---|---|---|---|---|---|---|---|---|
| PIPE-ARCH-001 | {{Pipeline_or_Storage_Zone}} | {{Batch_Streaming_CDC}} | {{Source}} | {{Target}} | {{Logic_Ref}} | {{Orchestrator}} | {{Schedule_or_Trigger}} | {{SLA}} | {{Failure_Handling}} | {{DATA_IDs}} |

Instruction: `Ingestion_Pattern` names batch, streaming, and CDC as generically-recommended options for the Data & Analytics domain. Record which pattern(s) an engagement actually uses or is adopting — do not assume CDC is already in use unless source evidence confirms it.

- Target_Sizing_Placeholders: {{Source_System_Count}} source systems, {{Table_Count}} tables, {{Modeled_Object_Count}} modeled standard objects, {{Derived_View_Count}} derived views — fill per engagement from `01_Source_Baseline.md` evidence.

## Master Data Management Design
Instruction: Required when `Data_Governance_Quality_MDM ∈ Data_Analytics_Subtype`; mark Not Applicable with rationale otherwise.

| MDM_ID | Master_Entity | Data_Classification | Golden_Record_Survivorship_Rule | Entity_Resolution_Method | Steward_Owner | Related_Data_IDs |
|---|---|---|---|---|---|---|
| MDM-001 | {{Entity_Customer_Product_Vendor_Other}} | {{Master_Reference_Transactional}} | {{Survivorship_Rule}} | {{Deterministic_Match_Probabilistic_Match_Manual_Review}} | {{Steward_Owner}} | {{DATA_IDs}} |

## Access Control And Masking Rules
Instruction: Required when `Data_Analytics_Subtype` includes Data_Warehouse_Lakehouse, BI_Reporting_Analytics, or Data_Governance_Quality_MDM; mark Not Applicable with rationale otherwise. Shares vocabulary with the BI dashboard access-tiering in `05_Technology_Engineering_And_Design.md` — do not define a duplicate scheme.

| Access_Rule_ID | Data_or_Field | PII_Tier | ABAC_Rule | Masking_or_Tokenization_Technique | Row_or_Column_Level_Rule | Applicable_Environment | Related_Data_IDs |
|---|---|---|---|---|---|---|---|
| ACCESS-001 | {{Data_or_Field}} | {{Public_Internal_Confidential_Restricted_PII_Restricted_PHI_PCI}} | {{ABAC_Rule}} | {{Static_Masking_Dynamic_Masking_Tokenization_Format_Preserving_Encryption_None}} | {{RLS_or_CLS_Rule}} | {{Prod_NonProd_All}} | {{DATA_IDs}} |

## BI Semantic Model And Metric Layer Architecture
Instruction: Required when `BI_Reporting_Analytics ∈ Data_Analytics_Subtype`; mark Not Applicable with rationale otherwise. Detailed dashboard/report inventory and refresh-cadence detail live in `05_Technology_Engineering_And_Design.md`; see `24_BI_Semantic_Model_And_Dashboard_Template.md` for the specialized reference extraction this section consolidates.

| Semantic_ID | Metric_or_KPI | Formula_or_Grain | Source_Dataset | Certification_Status | Access_Tiering_Ref | Related_KPI_IDs |
|---|---|---|---|---|---|---|
| SEM-001 | {{Metric_or_KPI}} | {{Formula_and_Grain}} | {{Source_Dataset}} | {{Draft_Certified_Deprecated}} | {{Access_Rule_ID}} | {{KPI_IDs}} |

## Target Database And Storage
| Storage_ID | Store_or_Table | Purpose | Key_Fields_or_Objects | Constraints | Indexing_Search_Needs | Migration_Needs | Related_Data_IDs |
|---|---|---|---|---|---|---|---|
| STORE-001 | {{Store_or_Table}} | {{Purpose}} | {{Fields}} | {{Constraints}} | {{Indexing}} | {{Migration}} | {{DATA_IDs}} |

## Database Detail And Access Patterns
Instruction: Preserve schema, relationships, cardinality, data access, connectivity, and database source detail from the database template.

| DB_Detail_ID | Entity_or_Object | Entity_Type | Columns_or_Attributes | Keys_Constraints_Indexes | Relationships_Cardinality | Access_Patterns | Connectivity_or_Architecture | Source_IDs |
|---|---|---|---|---|---|---|---|---|
| DB-DET-001 | {{Entity_or_Object}} | {{Table_Collection_View_File_Queue_Other}} | {{Columns}} | {{Keys_Constraints_Indexes}} | {{Relationships}} | {{Access_Patterns}} | {{Connectivity}} | {{Source_IDs}} |

## Security Privacy And Compliance Architecture
| Security_Control_ID | Control | Applies_To | Threat_or_Risk | Mechanism | Evidence_Needed | Related_NFR_CON_CMP_DATA_IDs |
|---|---|---|---|---|---|---|
| SEC-001 | {{Control}} | {{Component_Data_Integration}} | {{Threat_or_Risk}} | {{Mechanism}} | {{Evidence}} | {{IDs}} |

Threat model summary:
- Assets: {{Assets}}
- Actors: {{Actors}}
- Abuse_Cases: {{Abuse_Cases}}
- Trust_Boundary_Risks: {{Trust_Boundary_Risks}}
- Residual_Risks: {{Residual_Risks}}

Compliance mapping summary:
| Compliance_ID | Framework_or_Policy | Requirement | Architecture_Control | Evidence | Owner | Status |
|---|---|---|---|---|---|---|
| CMP-001 | {{SOC2_ISO27001_GDPR_HIPAA_PCI_SOX_Internal_Other}} | {{Requirement}} | {{Control}} | {{Evidence}} | {{Owner}} | {{Compliant_Partial_NA_Open}} |

## Scalability Resilience And Operations
| Ops_Architecture_ID | Area | Target | Strategy | Degraded_Behavior | RPO | RTO | Monitoring_or_Runbook | Related_NFR_IDs |
|---|---|---|---|---|---|---|---|---|
| RES-001 | {{Availability_Performance_Resilience_Backup_Observability}} | {{Target}} | {{Strategy}} | {{Degraded}} | {{RPO}} | {{RTO}} | {{Monitoring_Runbook}} | {{NFR_IDs}} |

## Infrastructure Deployment And Architecture Roadmap
| Roadmap_ID | Phase | Capability_or_Architecture_Item | Environment_or_Deployment_Unit | Status | Dependency | Technical_Debt_or_Risk | Decision_Required | Related_IDs |
|---|---|---|---|---|---|---|---|---|
| ROAD-001 | {{MVP_Future_Migration_Phase}} | {{Capability_or_Item}} | {{Environment_or_Unit}} | {{Included_Deferred_Optional_Open}} | {{Dependency}} | {{Debt_or_Risk}} | {{Decision}} | {{IDs}} |

## Architecture Decisions
| ADR_ID | Decision | Status | Context | Options_Considered | Rationale | Consequences | Revisit_Trigger | Approver | Related_IDs |
|---|---|---|---|---|---|---|---|---|---|
| ADR-001 | {{Decision}} | {{Proposed_Accepted_Rejected_Superseded}} | {{Context}} | {{Options}} | {{Rationale}} | {{Consequences}} | {{Trigger}} | {{Approver}} | {{IDs}} |

## Architecture Risks And Open Questions
| Item_ID | Type | Question_or_Risk | Impact | Owner | Due_Date | Blocking | Related_IDs |
|---|---|---|---|---|---|---|---|
| AR-001 | {{Open_Question_ARCHITECTURE_RISK}} | {{Item}} | {{Impact}} | {{Owner}} | {{YYYY-MM-DD}} | {{Yes_No}} | {{IDs}} |

## Traceability Instructions
- Every component, integration, data item, security control, resilience target, and ADR must map to requirements, NFRs, current-state evidence, or source inputs.
- Target-state decisions must identify whether they are source-derived, retained from current state, or `[RECOMMENDATION]`.
- Every Data Pipeline And Storage Architecture row must map to a Current-State pipeline entry (03) when one exists, or be marked greenfield.
- Every Master Data Management Design row must include a golden-record/survivorship rule, entity-resolution method, and named steward — never leave any of the three blank when this section is required.
- Every BI Semantic Model And Metric Layer Architecture row must reference an Access_Rule_ID from Access Control And Masking Rules.
