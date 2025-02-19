import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SupabaseField {
  name: string;
  type: string;
  isNullable: boolean;
  maxLength?: number;
}

interface SchemaAnalyzerProps {
  credentials: {
    supabaseUrl: string;
    supabaseKey: string;
    appwriteEndpoint: string;
    appwriteProjectId: string;
    appwriteApiKey: string;
  };
  tableName: string;
  databaseId: string;
  collectionId: string;
  onSchemaCreated: () => void;
}

export function SchemaAnalyzer({
  credentials,
  tableName,
  databaseId,
  collectionId,
  onSchemaCreated
}: SchemaAnalyzerProps) {
  const [fields, setFields] = React.useState<SupabaseField[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  // Fetch Supabase schema
  const fetchSupabaseSchema = async () => {
    try {
      const response = await fetch(
        `${credentials.supabaseUrl}/rest/v1/${tableName}`,
        {
          method: 'GET',
          headers: {
            'apikey': credentials.supabaseKey,
            'Authorization': `Bearer ${credentials.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Supabase schema');
      }

      // Get schema from response headers
      const definition = response.headers.get('X-PostgreSQL-Types');
      const types = response.headers.get('Content-Type');
      
      // Also fetch a sample record to analyze the data structure
      const data = await response.json();
      const sampleRecord = data[0] || {};

      // Analyze the fields from the sample record
      const analyzedFields = Object.entries(sampleRecord).map(([name, value]) => ({
        name,
        type: getAppwriteType(value),
        isNullable: value === null,
        maxLength: typeof value === 'string' ? Math.max(value.length, 255) : undefined
      }));

      setFields(analyzedFields);
      return analyzedFields;
    } catch (error) {
      throw new Error(`Failed to fetch Supabase schema: ${error}`);
    }
  };

  // Create Appwrite attributes
  const createAppwriteAttributes = async (fields: SupabaseField[]) => {
    for (const field of fields) {
      // Skip Supabase system fields
      if (['id', 'created_at', 'updated_at'].includes(field.name)) {
        continue;
      }

      try {
        const response = await fetch(
          `${credentials.appwriteEndpoint}/databases/${databaseId}/collections/${collectionId}/attributes/${field.type}`,
          {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': credentials.appwriteProjectId,
              'X-Appwrite-Key': credentials.appwriteApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: field.name,
              required: !field.isNullable,
              ...(field.maxLength && { size: field.maxLength }),
              ...(field.type === 'string' && { size: field.maxLength || 255 })
            })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
      } catch (error) {
        console.error(`Failed to create attribute ${field.name}:`, error);
        // Continue with other fields even if one fails
      }
    }
  };

  // Map Supabase types to Appwrite types
  const getAppwriteType = (value: any): string => {
    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isInteger(value) ? 'integer' : 'double';
      case 'boolean':
        return 'boolean';
      case 'object':
        if (value === null) return 'string'; // Default to string for null values
        if (Array.isArray(value)) return 'string'; // Store arrays as JSON strings
        return 'string'; // Store objects as JSON strings
      default:
        return 'string';
    }
  };

  const analyzeAndCreateSchema = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch and analyze Supabase schema
      const analyzedFields = await fetchSupabaseSchema();
      
      // 2. Create matching attributes in Appwrite
      await createAppwriteAttributes(analyzedFields);

      // 3. Notify parent component
      onSchemaCreated();
      console.log('Schema created successfully');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create schema');
      console.error('Schema creation error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Schema Analysis</h3>
            <Button
              onClick={analyzeAndCreateSchema}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze & Create Schema'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {fields.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Detected Fields:</h4>
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm font-medium">{field.name}</span>
                    <span className="text-sm text-gray-500">
                      {field.type}
                      {field.isNullable ? ' (optional)' : ' (required)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}