# Database Extraction Template

## Metadata
Instruction: Capture database architecture, schema, and operational details from an existing application.

- Project_Name: {{Project_Name}}
- Database_Reference_Folder: {{Database_Reference_Folder_Path}}
- Database_Reference_Manifest: {{Database_Reference_Manifest_Path}}
- Database_Name: {{Database_Name}}
- Database_Type: {{Database_Type}}  # e.g., PostgreSQL, MySQL, SQL Server, Oracle, MongoDB
- Database_Version: {{Database_Version}}
- Source_App_Version: {{Source_App_Version}}
- Document_Version: {{Document_Version}}
- Date: {{Date}}
- Author: {{Author}}

## Purpose
Instruction: Document the existing database design, data model, and operational constraints so an AI agent can align new implementation and migration work with business requirements.

- Objective: {{Objective}}
- Related_FR_IDs: {{Related_FR_IDs}}
- Related_NFR_IDs: {{Related_NFR_IDs}}
- Related_Security_Controls: {{Related_Security_Controls}}

## Database Overview
Instruction: Summarize the database role and data domains.

- Primary_Use_Cases: {{Primary_Use_Cases}}
- Data_Domains: {{Data_Domains}}
- Transactional_Vs_Analytical: {{Transactional_Vs_Analytical}}
- Multi-Tenancy: {{Multi_Tenancy_Model}}
- High_Availability_Model: {{High_Availability_Model}}

## Database Source Inventory
Instruction: List schema exports, ERDs, DDL, data dictionaries, migration notes, and data-sync references consumed from the database reference folder.

| DB_Source_ID | Source_File_or_Folder | Source_Type | Related_Data_Domain | Status | Usage | Notes |
|---|---|---|---|---|---|---|
| DB-SRC-001 | {{Source_File_or_Folder}} | {{Schema_ERD_DDL_DataDictionary_MigrationNote_DataSyncReference}} | {{Data_Domain}} | {{Approved_Draft_Reference_Only}} | {{Used_For}} | {{Notes}} |

## Connectivity and Architecture
Instruction: Capture database deployment architecture and access patterns.

- Network_Location: {{Network_Location}}  # e.g., private subnet, VPC, on-prem
- Connection_Protocols: {{Connection_Protocols}}
- Access_Controls: {{Access_Controls}}  # e.g., RBAC, service accounts, IP allowlists
- Backup_Retention: {{Backup_Retention}}
- Disaster_Recovery: {{Disaster_Recovery}}
- Encryption: {{Encryption_At_Rest}} / {{Encryption_In_Transit}}

## Schema Inventory
Instruction: Document tables, collections, views, and data entities.

| Entity_ID | Entity_Name | Type | Purpose | Related_FR_IDs | Notes |
|---|---|---|---|---|---|
| DB-001 | {{Table_or_Collection_Name}} | {{Table/Collection/View}} | {{Purpose}} | {{Related_FR_IDs}} | {{Notes}} |

## Table / Collection Details
Instruction: Capture schema details for each entity.

### {{Entity_Name}} ({{Entity_Type}})
- Primary_Key: {{Primary_Key}}
- Foreign_Keys: {{Foreign_Keys}}
- Columns/Fields:
  | Column/Field_Name | Data_Type | Nullable | Default | Description | FR/NFR Reference |
  |---|---|---|---|---|---|
  | {{Column_Name}} | {{Data_Type}} | {{Yes/No}} | {{Default}} | {{Description}} | {{FR_NFR_Reference}} |
- Indexes:
  | Index_Name | Columns/Fields | Type | Unique | Purpose |
  |---|---|---|---|---|
  | {{Index_Name}} | {{Columns}} | {{B-Tree/Hash/GIN/...}} | {{Yes/No}} | {{Purpose}} |
- Constraints:
  - {{Constraint_Type}}: {{Constraint_Definition}}
- Retention/Archival Rules: {{Retention_Rules}}
- Data Classification: {{Data_Classification}}

## Relationships and Cardinality
Instruction: Describe entity relationships and data model cardinality.

- Relationship_1: {{Source_Entity}} → {{Target_Entity}} | Type: {{Cardinality}} | Notes: {{Notes}}
- Relationship_2: {{Source_Entity}} → {{Target_Entity}} | Type: {{Cardinality}} | Notes: {{Notes}}

## Data Access Patterns
Instruction: Capture common query and transactional patterns.

- Read_Patterns: {{Read_Patterns}}
- Write_Patterns: {{Write_Patterns}}
- Batch_Processes: {{Batch_Processes}}
- Reporting_Queries: {{Reporting_Queries}}
- Caching_Strategy: {{Caching_Strategy}}

## Migration and Change Considerations
Instruction: Document migration risks, change impact, and compatibility concerns.

- Schema_Change_Risks: {{Schema_Change_Risks}}
- Data_Quality_Issues: {{Data_Quality_Issues}}
- Integration_Dependencies: {{Integration_Dependencies}}
- Migration_Plan_Notes: {{Migration_Plan_Notes}}

## Security and Compliance
Instruction: Document DB-specific security and compliance controls.

- Authentication_Model: {{Authentication_Model}}
- Authorization_Model: {{Authorization_Model}}
- Audit_Logging: {{Audit_Logging}}
- Data_Encryption: {{Data_Encryption}}
- GDPR_PII_Controls: {{GDPR_PII_Controls}}
- Backup/Restore_Validation: {{Backup_Restore_Validation}}
- WAF/Firewall_Relationship: {{WAF_Firewall_Relationship}}

## Traceability Instructions
Instruction: Link database artifacts back to requirements and application context.

- Traceability_Rule_1: Each database entity must reference one or more FR/NFR IDs.
- Traceability_Rule_2: Connection and operational constraints must map to security requirements.
- Traceability_Rule_3: Any inferred schema or indexing decision must be marked as "Inferred" and justified.
- Traceability_Rule_4: If the existing app database is absent, note the planned database model, not assumptions.
- Traceability_Rule_5: Every consumed database reference must appear in Database Source Inventory.
