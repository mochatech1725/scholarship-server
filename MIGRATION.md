# Data Migration Guide

This guide explains how to migrate your MongoDB data to MySQL using the provided tools.

## Prerequisites

1. **Database Setup**: Run the SQL schema to create tables:
   ```sql
   source database/schema.sql
   ```

2. **JSON Data Exports**: Export your MongoDB data as JSON files:
   - `users.json`
   - `applications.json` 
   - `recommenders.json`

3. **AWS Credentials**: Ensure your AWS credentials are configured for Secrets Manager access.

## Migration Scripts

### Available Commands

```bash
# Run full migration
npm run migrate

# Dry run (no data inserted)
npm run migrate:dry-run

# Use custom data directory
npm run migrate:custom
```

### Command Line Options

```bash
# Basic usage
ts-node scripts/migrate-data.ts

# With options
ts-node scripts/migrate-data.ts \
  --dry-run \
  --data-dir=./my-data \
  --secret-arn=arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret
```

### Options

- `--dry-run`: Preview migration without inserting data
- `--data-dir=./path`: Specify custom data directory (default: `./data`)
- `--secret-arn=arn`: Specify custom AWS secret ARN

## Data Format

### Expected JSON Structure

#### users.json
```json
[
  {
    "userId": "auth0|123456789",
    "firstName": "John",
    "lastName": "Doe",
    "emailAddress": "john@example.com",
    "phoneNumber": "+1234567890",
    "profile": {
      "userPreferences": {
        "searchPreferences": {
          "subjectAreas": ["Computer Science"],
          "educationLevel": "undergraduate",
          "targetType": "Both",
          "gender": "Male",
          "ethnicity": "White",
          "essayRequired": false,
          "recommendationRequired": false
        }
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### applications.json
```json
[
  {
    "studentId": "auth0|123456789",
    "scholarshipId": "scholarship_123",
    "status": "submitted",
    "submissionDate": "2024-01-15T00:00:00.000Z",
    "notes": "Application notes",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
]
```

#### recommenders.json
```json
[
  {
    "studentId": "auth0|123456789",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@university.edu",
    "title": "Professor",
    "organization": "University of Example",
    "relationship": "Academic Advisor",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Migration Process

1. **Prepare Data**: Export your MongoDB collections as JSON files
2. **Create Tables**: Run the SQL schema to create MySQL tables
3. **Test Migration**: Run dry-run to check for issues
4. **Execute Migration**: Run the actual migration
5. **Verify Results**: Check the migration results and error logs

## Error Handling

The migration script provides detailed error reporting:

- **Individual Record Errors**: Each failed record is logged with details
- **Summary Report**: Final report shows processed vs inserted records
- **Graceful Degradation**: Continues processing even if some records fail

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check AWS credentials and secret ARN
2. **Data Format Errors**: Verify JSON structure matches expected format
3. **Foreign Key Violations**: Ensure referenced records exist
4. **Duplicate Key Errors**: Check for unique constraint violations

### Debug Mode

For detailed debugging, run with verbose logging:
```bash
DEBUG=* npm run migrate:dry-run
```

## Rollback

To rollback a migration:
1. Drop the affected tables
2. Re-run the schema creation
3. Re-run the migration with corrected data

## Support

For issues with the migration process:
1. Check the error logs in the migration output
2. Verify your JSON data format
3. Ensure your AWS credentials are properly configured 