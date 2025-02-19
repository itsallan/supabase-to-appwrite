export interface Credentials {
    supabaseUrl: string;
    supabaseKey: string;
    appwriteEndpoint: string;
    appwriteProjectId: string;
    appwriteApiKey: string;
  }
  
  export interface Collection {
    supabaseTable: string;
    appwriteDatabaseId: string;
    appwriteCollectionId: string;
  }
  
  export type MigrationStatus = 'idle' | 'migrating' | 'completed' | 'error';
  
  export interface LogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'error';
  }
  
  export interface MigrationProgress {
    totalRecords: number;
    migratedRecords: number;
    failedRecords: number;
  }
  
  export interface MigrationStats {
    startTime?: Date;
    endTime?: Date;
    totalCollections: number;
    progress: Record<string, MigrationProgress>;
  }