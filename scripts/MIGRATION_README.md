# MongoDB to MySQL Migration Guide

This guide explains how to migrate data from MongoDB collections to MySQL tables for the Scholarship Server application.

## Overview

The migration converts MongoDB collection dumps to MySQL format with proper field mapping and relationship handling. The project uses snake_case for database column names as per the established convention.

## Files

- `mongodb-to-mysql-converter.sql` - Comprehensive migration script with utilities
- `import-mongodb-data.sql` - Simple import script for basic data conversion

## Field Mapping

### MongoDB to MySQL Column Mapping

| MongoDB Field | MySQL Column | Type | Notes |
|---------------|--------------|------|-------|
| `_id.$oid` | `[table]_id` | INT | Auto-increment primary key |
| `studentId` | `student_id` | VARCHAR(255) | Auth0 user ID |
| `scholarshipName` | `scholarship_name` | VARCHAR(500) | |
| `targetType` | `target_type` | VARCHAR(100) | |
| `company` | `company` | VARCHAR(255) | |
| `companyWebsite` | `company_website` | VARCHAR(500) | |
| `applicationLink` | `application_link` | VARCHAR(500) | |
| `amount` | `amount` | DECIMAL(10,2) | |
| `platform` | `platform` | VARCHAR(255) | |
| `theme` | `theme` | VARCHAR(255) | |
| `openDate.$date` | `open_date` | DATE | |
| `dueDate.$date` | `due_date` | DATE | |
| `submissionDate.$date` | `submission_date` | TIMESTAMP | |
| `status` | `status` | ENUM | |
| `currentAction` | `current_action` | VARCHAR(255) | |
| `renewable` | `renewable` | BOOLEAN | |
| `requirements` | `requirements` | TEXT | |
| `renewableTerms` | `renewable_terms` | TEXT | |
| `createdAt.$date` | `created_at` | TIMESTAMP | |
| `updatedAt.$date` | `updated_at` | TIMESTAMP | |
| `firstName` | `first_name` | VARCHAR(100) | |
| `lastName` | `last_name` | VARCHAR(100) | |
| `emailAddress` | `email_address` | VARCHAR(255) | |
| `phoneNumber` | `phone_number` | VARCHAR(20) | |
| `relationship` | `relationship` | VARCHAR(100) | |
| `userId` | `auth_user_id` | VARCHAR(255) | |

### Complex Field Mappings

- `userPreferences.searchPreferences` → `user_search_preferences` table (separate table)
- `recommendations[]` → `recommendations` table (array to separate records)
- `essays[]` → `essays` table (array to separate records)

## Migration Process

### 1. Prerequisites

- MySQL database with the schema created from `database/schema.sql`
- MongoDB collection dumps in JSON format
- MySQL client or workbench

### 2. Run the Migration

```bash
# Connect to your MySQL database
mysql -u username -p database_name

# Run the migration script
source scripts/mongodb-to-mysql-converter.sql;
```

### 3. Verification

The migration script includes verification queries that will show:
- Count of imported records for each table
- Relationship verification between tables
- Data integrity checks

## Data Transformations

### Date Conversion
MongoDB dates in format `{"$date": "2024-01-01T00:00:00.000Z"}` are converted to MySQL TIMESTAMP format.

### Array to Table Conversion
Embedded arrays in MongoDB documents are converted to separate table records with foreign key relationships:

- **Essays**: Each essay in the `essays[]` array becomes a separate record in the `essays` table
- **Recommendations**: Each recommendation in the `recommendations[]` array becomes a separate record in the `recommendations` table

### Nested Object Conversion
Nested objects like `userPreferences.searchPreferences` are flattened into a separate `user_search_preferences` table.

## Status Mapping

MongoDB status values are mapped to MySQL ENUM values:

| MongoDB Status | MySQL Status |
|----------------|--------------|
| "Pending" | "pending" |
| "Submitted" | "submitted" |
| "Declined" | "declined" |

## Error Handling

The migration scripts use `ON DUPLICATE KEY UPDATE` clauses to handle potential duplicate records and update existing data instead of failing.

## Utilities

### Custom Functions

- `convert_mongo_date()` - Converts MongoDB date format to MySQL timestamp
- `convert_mongo_id()` - Placeholder for ObjectId conversion (currently returns NULL)

## Troubleshooting

### Common Issues

1. **Foreign Key Constraints**: Ensure all referenced users exist before importing related data
2. **Date Format Issues**: Check that MongoDB date strings are in the expected format
3. **Duplicate Records**: The scripts handle duplicates gracefully with UPDATE clauses

### Verification Queries

Run these queries to verify the migration:

```sql
-- Check record counts
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Applications', COUNT(*) FROM applications
UNION ALL
SELECT 'Essays', COUNT(*) FROM essays
UNION ALL
SELECT 'Recommendations', COUNT(*) FROM recommendations;

-- Check relationships
SELECT 
    a.scholarship_name,
    COUNT(e.essay_id) as essay_count,
    COUNT(r.recommendation_id) as recommendation_count
FROM applications a
LEFT JOIN essays e ON a.application_id = e.application_id
LEFT JOIN recommendations r ON a.application_id = r.application_id
GROUP BY a.application_id, a.scholarship_name;
```

## Rollback

To rollback the migration, you can drop and recreate the tables:

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS essays;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS user_search_preferences;
DROP TABLE IF EXISTS recommenders;
DROP TABLE IF EXISTS users;

-- Recreate schema
source database/schema.sql;
```

## Notes

- The migration preserves all data relationships
- Timestamps are converted to the server's timezone
- JSON arrays are stored as MySQL JSON type where appropriate
- The migration is idempotent - running it multiple times won't create duplicates 