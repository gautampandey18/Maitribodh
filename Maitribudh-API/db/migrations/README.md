# Database migrations

Migrations use the `0001_description.sql` naming convention. Applied files are checksum-verified and must not be edited.

`0001_initial_schema.sql` adopts the 12-table SRC-007 model without sample seed data. It includes the required consent and guardian-consent metadata from FR-021 and stores passport values encrypted, consistent with DATA-002. The API must validate guardian eligibility and encrypt/decrypt sensitive identifiers; the database stores only encrypted values and last-four display fields.