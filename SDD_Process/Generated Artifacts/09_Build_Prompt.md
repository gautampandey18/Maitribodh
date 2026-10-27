# Build Prompt (Stale Record)

## Metadata
- Project_Name: Maitribodh Access Management System (MAMS)
- Execution_Mode: Reverse_Engineering_Only
- Delivery_Tier: Enterprise
- Domain: Software
- Data_Analytics_Subtype: Not_Applicable
- Source_Baseline_ID: SRC-BL-005
- Source_Baseline_Status: Stale
- Open_Source_Change_IDs: SRC-CHG-005
- Document_Version: 3.7
- Date: 2026-10-27
- Build_Prompt_Status: Stale_Not_Approved
- Implementation_Authorization: None for SRC-BL-006

> **STALE — DO NOT EXECUTE.** The previous forward-engineering prompt was based on SRC-BL-005. This run establishes SRC-BL-006 as a reverse-engineering-only current-state baseline; it does not authorize implementation.

## Purpose
This file is retained as a staleness record only. Its prior build instructions have been withdrawn from the active artifact set because they contain target assumptions and approvals that do not describe the current repository baseline.

## Staleness Reason
- Current code, migrations, tests and updated implementation documentation were not represented in the prior prompt.
- The prior prompt treated the project as greenfield and stated that current-state analysis was not applicable.
- Prior G1 approval and waivers apply only to SRC-BL-005; they are not approvals for SRC-BL-006.
- The current API/UI test runs contain failures, and live database/deployment evidence has not been inspected.

## Reissue Conditions
- Obtain an explicit target-state feature, modernization, rewrite or migration scope.
- Select the applicable ADLC execution mode and establish a fresh accepted source baseline.
- Regenerate the target requirements, architecture, backlog, quality and governance artifacts that the scope impacts.
- Resolve or explicitly disposition the observed test failures and obtain current owner approvals.
- Generate and validate a new build prompt only after the new target baseline is accepted.
