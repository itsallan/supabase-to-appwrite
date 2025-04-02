# Schema Analyzer Component Documentation

The Schema Analyzer is a key component of the Supabase to Appwrite Migration Tool. It analyzes Supabase table structures and automatically creates matching attributes in Appwrite collections.

## How It Works

### 1. Schema Detection

When you click "Analyze & Create Schema", the component:

1. Sends a request to your Supabase table
2. Retrieves a sample of records
3. Analyzes the data structure:
   - Field names
   - Data types
   - Nullability
   - String lengths

### 2. Type Mapping

The component maps Supabase types to Appwrite types:

| Supabase Type | Appwrite Type | Notes |
|--------------|---------------|-------|
| text, varchar | string | Uses max detected length |
| integer, bigint | integer | |
| float, double | double | |
| boolean | boolean | |
| json, jsonb | string | Stored as JSON string |
| timestamp | string | Stored as ISO string |
| array | string | Stored as JSON string |

### 3. Attribute Creation

For each field detected in Supabase, the component:

1. Skips system fields (id, created_at, updated_at)
2. Creates a matching attribute in the Appwrite collection
3. Sets proper constraints (required/optional)
4. Sets appropriate size values for strings

### 4. Validation

After creating the schema, the component:

1. Verifies the attributes were created
2. Notifies the parent component of completion
3. Enables the migration button

## Using the Schema Analyzer

### Prerequisites

Before using the Schema Analyzer:

1. Your Supabase table must have data
2. You must have an Appwrite collection created (can be empty)
3. Your API key must have permission to create attributes

### Best Practices

For optimal results:

1. **Analyze First**: Always analyze and create the schema before migrating
2. **Check Attributes**: Review the created attributes in the Appwrite console
3. **Handle Special Types**: For complex data types, consider pre-processing
4. **Multiple Collections**: Process one collection at a time for large datasets

### Handling Edge Cases

The Schema Analyzer handles several edge cases:

- **NULL Values**: Attributes are set as optional if NULL values are detected
- **Empty Tables**: Returns a warning if the table has no data to analyze
- **Type Conflicts**: Uses the most permissive type when conflicting types are found
- **Long Strings**: Sets appropriate string length based on sample data
- **Complex Objects**: Converts to JSON strings for storage

## Troubleshooting

### Common Issues

#### "Failed to fetch Supabase schema"
- Check your Supabase URL and API key
- Ensure the table exists and has data

#### "Failed to create attribute"
- Check if the attribute already exists
- Verify your API key has the required permissions
- Ensure the attribute name follows Appwrite requirements

#### "Attribute creation conflict"
- Two fields with the same name but different types
- Rename one of the fields in Supabase or create the attribute manually

## Customizing the Schema Analyzer

To customize the Schema Analyzer for special needs:

1. Modify the `getAppwriteType` function to change type mapping
2. Adjust the `maxLength` calculation for string fields
3. Change the attribute creation parameters as needed

## Integration

The Schema Analyzer integrates with the main migration tool through:

1. The `onSchemaCreated` callback
2. Shared access to credentials
3. Collection mapping information

This ensures a seamless workflow from schema analysis to data migration.