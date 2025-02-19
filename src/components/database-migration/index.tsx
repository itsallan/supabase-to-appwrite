'use client';

import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Credentials, Collection, MigrationStatus, LogEntry } from '@/lib/types';
import { CredentialsForm } from './credentials-form';
import { CollectionForm } from './collection-form';
import { MigrationLogs } from './migration-logs';
import { SchemaAnalyzer } from './schema-analyzer';

interface AppwriteAttribute {
  key: string;
  type: string;
  required: boolean;
}

interface MigrationProgress {
  current: number;
  total: number;
  collection: string;
}

export function DatabaseMigration() {
  // State management
  const [credentials, setCredentials] = useState<Credentials>({
    supabaseUrl: '',
    supabaseKey: '',
    appwriteEndpoint: '',
    appwriteProjectId: '',
    appwriteApiKey: '',
  });

  const [collections, setCollections] = useState<Collection[]>([{
    supabaseTable: '',
    appwriteDatabaseId: '',
    appwriteCollectionId: ''
  }]);

  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [schemaReady, setSchemaReady] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<MigrationProgress>({
    current: 0,
    total: 0,
    collection: ''
  });

  const shouldContinue = useRef(true);

  // Utility functions
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: uuidv4(),
      timestamp: new Date(),
      message,
      type
    }]);
  }, []);

  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    addLog(`${context}: ${errorMessage}`, 'error');
    return errorMessage;
  }, [addLog]);

  // Schema validation
  const validateSchema = async (databaseId: string, collectionId: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch(
        `${credentials.appwriteEndpoint}/databases/${databaseId}/collections/${collectionId}`,
        {
          headers: {
            'X-Appwrite-Project': credentials.appwriteProjectId,
            'X-Appwrite-Key': credentials.appwriteApiKey
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get collection schema: ${error.message}`);
      }

      const collection = await response.json();
      return (collection.attributes || []) as AppwriteAttribute[];
    } catch (error) {
      throw new Error(handleError(error, 'Schema validation failed'));
    }
  };

  // Data transformation
  const transformData = (data: Record<string, unknown>, attributes: AppwriteAttribute[]) => {
    const { id, created_at, updated_at, ...restData } = data;
    const validFields = attributes.map(attr => attr.key);

    const cleanData = Object.entries(restData).reduce((acc, [key, value]) => {
      if (validFields.includes(key) && value !== null) {
        const attribute = attributes.find(attr => attr.key === key);
        if (attribute) {
          acc[key] = formatValue(value, attribute.type);
        }
      }
      return acc;
    }, {} as Record<string, unknown>);

    return { cleanData, documentId: id ? String(id) : uuidv4() };
  };

  const formatValue = (value: unknown, type: string): unknown => {
    switch (type) {
      case 'string':
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      case 'integer':
      case 'double':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  };

  // API interactions
  const createAppwriteDocument = async (databaseId: string, collectionId: string, data: Record<string, unknown>) => {
    try {
      const attributes = await validateSchema(databaseId, collectionId, data);
      const { cleanData, documentId } = transformData(data, attributes);

      const response = await fetch(
        `${credentials.appwriteEndpoint}/databases/${databaseId}/collections/${collectionId}/documents`,
        {
          method: 'POST',
          headers: {
            'X-Appwrite-Project': credentials.appwriteProjectId,
            'X-Appwrite-Key': credentials.appwriteApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ documentId, data: cleanData })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      return response.json();
    } catch (error) {
      throw new Error(handleError(error, 'Document creation failed'));
    }
  };

  const fetchSupabaseData = async (tableName: string) => {
    try {
      const response = await fetch(`${credentials.supabaseUrl}/rest/v1/${tableName}`, {
        headers: {
          'apikey': credentials.supabaseKey,
          'Authorization': `Bearer ${credentials.supabaseKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(handleError(error, 'Supabase data fetch failed'));
    }
  };

  // Event handlers
  const handleCredentialsChange = useCallback((newCredentials: Credentials) => {
    setCredentials(newCredentials);
  }, []);

  const handleCollectionsChange = useCallback((newCollections: Collection[]) => {
    setCollections(newCollections);
  }, []);

  const handleSchemaCreated = useCallback((collectionKey: string) => {
    setSchemaReady(prev => ({
      ...prev,
      [`${collectionKey}-0`]: true
    }));
  }, []);

  const handleCancelMigration = useCallback(() => {
    shouldContinue.current = false;
    addLog('Canceling migration... Will complete current record.', 'info');
  }, [addLog]);

  const startMigration = async () => {
    setStatus('migrating');
    setError('');
    setLogs([]);
    shouldContinue.current = true;

    try {
      // Validation
      if (!Object.values(credentials).every(Boolean)) {
        throw new Error('All credentials are required');
      }

      if (!collections.every(c => Object.values(c).every(Boolean))) {
        throw new Error('All collection fields are required');
      }

      // Migration process
      for (const collection of collections) {
        if (!shouldContinue.current) {
          addLog('Migration canceled.', 'info');
          setStatus('idle');
          return;
        }

        try {
          const supabaseData = await fetchSupabaseData(collection.supabaseTable);
          
          setProgress({
            total: supabaseData.length,
            current: 0,
            collection: collection.supabaseTable
          });

          addLog(`Found ${supabaseData.length} records in ${collection.supabaseTable}`);

          for (let i = 0; i < supabaseData.length; i++) {
            if (!shouldContinue.current) break;

            try {
              await createAppwriteDocument(
                collection.appwriteDatabaseId,
                collection.appwriteCollectionId,
                supabaseData[i]
              );
              
              setProgress(prev => ({ ...prev, current: i + 1 }));
              addLog(`✓ Migrated record ${i + 1}/${supabaseData.length}`, 'success');
            } catch (error) {
              addLog(`✗ Failed to migrate record ${i + 1}/${supabaseData.length}`, 'error');
            }
          }

          addLog(`Completed migration for ${collection.supabaseTable}`, 'success');
        } catch (error) {
          handleError(error, `Migration failed for ${collection.supabaseTable}`);
        }
      }

      setStatus('completed');
    } catch (error) {
      setError(handleError(error, 'Migration process failed'));
      setStatus('error');
    }
  };

  // Render helpers
  const renderProgress = () => {
    if (status !== 'migrating' || progress.total === 0) return null;
    
    const percentage = Math.round((progress.current / progress.total) * 100);
    return (
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          Migrating {progress.collection}: {progress.current}/{progress.total} records ({percentage}%)
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Migration Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <CredentialsForm
          credentials={credentials}
          onChange={handleCredentialsChange}
        />

        <CollectionForm
          collections={collections}
          onChange={handleCollectionsChange}
        />

        {/* Only show schema analyzer when not migrating */}
        {status === 'idle' && collections.map((collection, index) => (
          collection.supabaseTable && collection.appwriteDatabaseId && collection.appwriteCollectionId ? (
            <SchemaAnalyzer
              key={`${collection.supabaseTable}-${index}`}
              credentials={credentials}
              tableName={collection.supabaseTable}
              databaseId={collection.appwriteDatabaseId}
              collectionId={collection.appwriteCollectionId}
              onSchemaCreated={() => handleSchemaCreated(collection.supabaseTable)}
            />
          ) : null
        ))}

        {renderProgress()}

        <div className="flex gap-4">
          {status !== 'migrating' ? (
            <Button
              onClick={startMigration}
              className="flex-1"
            >
              Start Migration
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancelMigration}
                variant="destructive"
                className="flex-1"
              >
                Cancel Migration
              </Button>
              <Button
                disabled
                className="flex-1"
              >
                Migrating...
              </Button>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <MigrationLogs logs={logs} />
      </CardContent>
    </Card>
  );
}